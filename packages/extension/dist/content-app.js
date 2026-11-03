"use strict";
(() => {
  // packages/extension/src/content-app.ts
  try {
    localStorage.removeItem("tfb_ext_token");
  } catch {
  }
  function signalExtensionPresence() {
    try {
      const version = chrome.runtime.getManifest().version;
      document.documentElement.dataset.tfbExtension = version;
      window.dispatchEvent(new CustomEvent("tfb-extension-ready", { detail: { version } }));
      window.postMessage({ type: "TFB_EXTENSION_READY", version }, "*");
    } catch {
    }
  }
  if (document.readyState === "complete") {
    setTimeout(signalExtensionPresence, 0);
  } else {
    window.addEventListener("load", () => {
      setTimeout(signalExtensionPresence, 0);
    });
  }
  function getAppLanguage() {
    try {
      return localStorage.getItem("tfb_lang") || localStorage.getItem("tfb_language") || "en";
    } catch {
      return "en";
    }
  }
  var lastSyncedLanguage = "";
  function sendLanguageToBackground(lang) {
    if (!lang || lang === lastSyncedLanguage) return;
    lastSyncedLanguage = lang;
    try {
      chrome.runtime.sendMessage({ type: "TFB_SET_LANGUAGE", language: lang }, () => {
        if (chrome.runtime.lastError) {
        }
      });
    } catch (err) {
      console.debug("[TechFormBuddy] Language sync warning:", err);
    }
  }
  var initialLang = getAppLanguage();
  sendLanguageToBackground(initialLang);
  window.addEventListener("storage", (event) => {
    if (event.key === "tfb_lang" || event.key === "tfb_language") {
      if (event.newValue) {
        sendLanguageToBackground(event.newValue);
      }
    }
  });
  setInterval(() => {
    const currentLang = getAppLanguage();
    if (currentLang && currentLang !== lastSyncedLanguage) {
      sendLanguageToBackground(currentLang);
    }
  }, 1e3);
  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data) return;
    if (event.origin !== window.location.origin) return;
    const { type, language, url, requestId } = event.data;
    if (type === "TFB_SET_LANGUAGE") {
      if (language) {
        sendLanguageToBackground(language);
      }
    }
    if (type === "TFB_OPEN_WITH_BUDDY") {
      const targetLang = language || getAppLanguage();
      sendLanguageToBackground(targetLang);
      const taskName = event.data.taskName || "";
      try {
        chrome.runtime.sendMessage(
          {
            type: "TFB_SET_TASK",
            taskName,
            language: targetLang,
            url
          },
          () => {
            if (chrome.runtime.lastError) {
            }
          }
        );
      } catch {
      }
      console.log('[TechFormBuddy] "Open with Buddy" triggered with language:', targetLang, "task:", taskName, "portal:", url);
    }
    if (type === "TFB_REQUEST_CONNECT" && typeof requestId === "string") {
      void (async () => {
        try {
          const response = await fetch("/api/extension/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Chrome Extension (Desktop)" }),
            credentials: "include"
          });
          if (!response.ok) throw new Error("Sign in to TechForm Buddy before connecting the extension.");
          const result = await response.json();
          const paired = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
              { type: "TFB_CONNECT", token: result.token, appUrl: window.location.origin },
              (runtimeResponse) => {
                if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
                else resolve(runtimeResponse || {});
              }
            );
          });
          if (!paired.success) throw new Error("The extension did not accept the connection request.");
          window.postMessage({ type: "TFB_CONNECT_RESULT", requestId, success: true }, window.location.origin);
        } catch (error) {
          window.postMessage({
            type: "TFB_CONNECT_RESULT",
            requestId,
            success: false,
            error: error instanceof Error ? error.message : "Extension connection failed."
          }, window.location.origin);
        }
      })();
    }
    if (type === "TFB_DISCONNECT") {
      chrome.runtime.sendMessage({ type: "TFB_DISCONNECT" });
    }
  });
})();
