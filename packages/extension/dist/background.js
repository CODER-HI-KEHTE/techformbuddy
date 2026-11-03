// src/lib/languages.ts
var SUPPORTED_LANGUAGES = [
  { code: "en", label: "English (India)", nativeName: "English", bcp47: "en-IN" },
  { code: "hi", label: "Hindi", nativeName: "\u0939\u093F\u0928\u094D\u0926\u0940", bcp47: "hi-IN" },
  { code: "ta", label: "Tamil", nativeName: "\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD", bcp47: "ta-IN" },
  { code: "te", label: "Telugu", nativeName: "\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41", bcp47: "te-IN" },
  { code: "bn", label: "Bengali", nativeName: "\u09AC\u09BE\u0982\u09B2\u09BE", bcp47: "bn-IN" },
  { code: "mr", label: "Marathi", nativeName: "\u092E\u0930\u093E\u0920\u0940", bcp47: "mr-IN" },
  { code: "gu", label: "Gujarati", nativeName: "\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0", bcp47: "gu-IN" },
  { code: "kn", label: "Kannada", nativeName: "\u0C95\u0CA8\u0CCD\u0CA8\u0CA1", bcp47: "kn-IN" },
  { code: "ml", label: "Malayalam", nativeName: "\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02", bcp47: "ml-IN" },
  { code: "pa", label: "Punjabi", nativeName: "\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40", bcp47: "pa-IN" },
  { code: "ur", label: "Urdu", nativeName: "\u0627\u0631\u062F\u0648", bcp47: "ur-IN" }
];
var ALLOWED_LANGUAGE_CODES = new Set(
  SUPPORTED_LANGUAGES.map((l) => l.code)
);
function sanitizeLanguage(code) {
  if (!code || typeof code !== "string") return "en";
  const clean = code.trim().toLowerCase().split(/[-_]/)[0];
  if (ALLOWED_LANGUAGE_CODES.has(clean)) {
    return clean;
  }
  return "en";
}
function getLanguageBcp47(code) {
  const safeCode = sanitizeLanguage(code);
  const match = SUPPORTED_LANGUAGES.find((l) => l.code === safeCode);
  return match?.bcp47 || "en-IN";
}
var LANG_CODE_TO_LABEL = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l.label])
);
var LANG_CODE_TO_NATIVE = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l.nativeName])
);

// packages/extension/src/background.ts
var DEFAULT_APP_URL = "http://localhost:3000";
async function getAuthConfig() {
  return new Promise((resolve) => {
    let sessionToken;
    const readLocal = () => {
      chrome.storage.local.get(["token", "appUrl", "language", "taskName"], (localItems) => {
        resolve({
          token: sessionToken || localItems.token || void 0,
          appUrl: localItems.appUrl || DEFAULT_APP_URL,
          language: sanitizeLanguage(localItems.language || "en"),
          taskName: localItems.taskName || ""
        });
      });
    };
    if (chrome.storage && chrome.storage.session) {
      chrome.storage.session.get(["token"], (sessionItems) => {
        if (sessionItems && sessionItems.token) {
          sessionToken = sessionItems.token;
        }
        readLocal();
      });
    } else {
      readLocal();
    }
  });
}
function saveToken(token, appUrl) {
  return new Promise((resolve) => {
    if (chrome.storage && chrome.storage.session) {
      chrome.storage.session.set({ token }, () => {
        chrome.storage.local.set({ token, appUrl }, () => resolve());
      });
    } else {
      chrome.storage.local.set({ token, appUrl }, () => resolve());
    }
  });
}
function clearAuthStorage() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(["token"], () => {
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.clear(() => resolve());
      } else {
        resolve();
      }
    });
  });
}
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message && message.type === "TFB_CONNECT") {
    const token = message.token;
    const appUrl = message.appUrl || DEFAULT_APP_URL;
    if (token) {
      saveToken(token, appUrl).then(() => {
        sendResponse({ success: true, message: "Extension paired successfully" });
      });
      return true;
    }
  }
  sendResponse({ success: false, error: "INVALID_PAYLOAD" });
  return false;
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;
  switch (message.type) {
    case "TFB_CONNECT": {
      const { token, appUrl } = message;
      if (!token) {
        sendResponse({ success: false, error: "TOKEN_REQUIRED" });
        return false;
      }
      saveToken(token, appUrl || DEFAULT_APP_URL).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    case "TFB_SET_LANGUAGE": {
      const lang = message.language || "en";
      chrome.storage.local.set({ language: lang }, () => {
        sendResponse({ success: true, language: lang });
      });
      return true;
    }
    case "TFB_SET_TASK": {
      const task = message.taskName || "";
      const lang = message.language;
      const url = message.url || "";
      chrome.storage.local.set(
        {
          taskName: task,
          taskUrl: url,
          ...lang ? { language: lang } : {}
        },
        () => {
          sendResponse({ success: true, taskName: task });
        }
      );
      return true;
    }
    case "TFB_GET_STATUS": {
      getAuthConfig().then((cfg) => {
        sendResponse({
          connected: Boolean(cfg.token),
          appUrl: cfg.appUrl,
          language: cfg.language,
          taskName: cfg.taskName || ""
        });
      });
      return true;
    }
    case "TFB_DISCONNECT": {
      clearAuthStorage().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
    case "TFB_MAP_FORM": {
      const { siteHost, language, fields, profileKeys } = message;
      getAuthConfig().then(async (cfg) => {
        if (!cfg.token) {
          sendResponse({
            error: "NO_AUTH",
            message: "Open TechForm Buddy and sign in",
            fallbackToLocal: true
          });
          return;
        }
        const endpoint = `${cfg.appUrl}/api/form/map`;
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cfg.token}`
            },
            body: JSON.stringify({
              siteHost,
              language: language || cfg.language || "en",
              fields,
              profileKeys: profileKeys || []
            })
          });
          if (res.status === 401) {
            sendResponse({
              error: "NO_AUTH",
              message: "Open TechForm Buddy and sign in",
              fallbackToLocal: true
            });
            return;
          }
          if (!res.ok) {
            sendResponse({
              error: "LLM_UNAVAILABLE",
              fallbackToLocal: true,
              status: res.status
            });
            return;
          }
          const data = await res.json();
          sendResponse({ success: true, mappings: data.mappings, fromCache: data.fromCache });
        } catch (err) {
          sendResponse({ error: "LLM_UNAVAILABLE", fallbackToLocal: true, message: err.message });
        }
      });
      return true;
    }
    case "TFB_GET_FILL_VALUES": {
      getAuthConfig().then(async (cfg) => {
        if (!cfg.token) {
          sendResponse({
            error: "NO_AUTH",
            message: "Open TechForm Buddy and sign in"
          });
          return;
        }
        const endpoint = `${cfg.appUrl}/api/profile/fill-values`;
        try {
          const res = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${cfg.token}`
            }
          });
          if (res.status === 401) {
            sendResponse({
              error: "NO_AUTH",
              message: "Open TechForm Buddy and sign in"
            });
            return;
          }
          if (!res.ok) {
            sendResponse({ error: "FETCH_FAILED", status: res.status });
            return;
          }
          const data = await res.json();
          const fillValues = data.fillValues || {};
          if (chrome.storage && chrome.storage.session) {
            chrome.storage.session.set({ fillValues });
          }
          sendResponse({ success: true, fillValues });
        } catch (err) {
          sendResponse({ error: "NETWORK_ERROR", message: err.message });
        }
      });
      return true;
    }
    case "TFB_GET_ON_VISIT_ALERTS": {
      const { domain } = message;
      getAuthConfig().then(async (cfg) => {
        const endpoint = `${cfg.appUrl}/api/watcher/on-visit?domain=${encodeURIComponent(domain || "")}`;
        try {
          const headers = {};
          if (cfg.token) {
            headers["Authorization"] = `Bearer ${cfg.token}`;
          }
          const res = await fetch(endpoint, { headers });
          if (!res.ok) {
            sendResponse({ hasAlerts: false, alerts: [] });
            return;
          }
          const data = await res.json();
          sendResponse(data);
        } catch (err) {
          sendResponse({ hasAlerts: false, alerts: [], error: err.message });
        }
      });
      return true;
    }
    case "TFB_PAGE_GUIDE":
    case "TFB_ASSISTANT_QUERY": {
      const { query, domain, language, taskName, pageContext } = message;
      getAuthConfig().then(async (cfg) => {
        const endpoint = `${cfg.appUrl}/api/assistant`;
        const activeTask = taskName || pageContext?.taskName || cfg.taskName || "";
        const effectiveQuery = query || activeTask || pageContext?.title || "Portal Guidance";
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}
            },
            body: JSON.stringify({
              query: effectiveQuery,
              domain: domain || "government",
              language: language || cfg.language || "en",
              pageContext: {
                taskName: activeTask,
                url: message.url || pageContext?.url,
                title: message.title || pageContext?.title,
                headings: message.headings || pageContext?.headings,
                buttons: message.buttons || pageContext?.buttons,
                ...pageContext
              }
            })
          });
          if (!res.ok) {
            sendResponse({ error: "ASSISTANT_FAILED", status: res.status });
            return;
          }
          const data = await res.json();
          sendResponse({
            success: true,
            found: data.found,
            data: data.data,
            aiAdvice: data.aiAdvice
          });
        } catch (err) {
          sendResponse({ error: "NETWORK_ERROR", message: err.message });
        }
      });
      return true;
    }
    case "TFB_ASSISTANT_CHAT": {
      const { messages, pageSnapshot, language, profileValues, fieldIndex } = message;
      getAuthConfig().then(async (cfg) => {
        const endpoint = `${cfg.appUrl}/api/assistant/chat`;
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}
            },
            body: JSON.stringify({
              messages,
              pageSnapshot,
              language: language || cfg.language || "en",
              profileValues,
              fieldIndex,
              isBriefing: message.isBriefing
            })
          });
          if (!res.ok) {
            sendResponse({ error: "CHAT_FAILED", status: res.status });
            return;
          }
          const data = await res.json();
          sendResponse({ success: true, ...data });
        } catch (err) {
          sendResponse({ error: "NETWORK_ERROR", message: err.message });
        }
      });
      return true;
    }
    case "TFB_DOWNLOAD": {
      const { url, filename } = message;
      if (!url) {
        sendResponse({ success: false, error: "URL_REQUIRED" });
        return false;
      }
      try {
        if (chrome.downloads && typeof chrome.downloads.download === "function") {
          chrome.downloads.download(
            {
              url,
              filename: filename || "downloaded-document.pdf",
              saveAs: true
            },
            (downloadId) => {
              if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
              } else {
                sendResponse({ success: true, downloadId });
              }
            }
          );
          return true;
        } else {
          sendResponse({ success: true, simulated: true, url, filename });
          return false;
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
        return false;
      }
    }
    case "TFB_CLEAR_SESSION": {
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.clear(() => {
          sendResponse({ success: true });
        });
        return true;
      }
      sendResponse({ success: true });
      return false;
    }
    case "TFB_TRANSLATE_TO_ENGLISH": {
      const { text, from = "auto" } = message;
      getAuthConfig().then(async (cfg) => {
        try {
          const endpoint = `${cfg.appUrl}/api/translate`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, from, to: "en" })
          });
          if (res.ok) {
            const data = await res.json();
            sendResponse({ success: true, translatedText: data.translatedText || text });
            return;
          }
        } catch {
          try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=en&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && Array.isArray(data[0])) {
                const translated = data[0].map((item) => item && item[0] ? item[0] : "").join("");
                sendResponse({ success: true, translatedText: translated.trim() || text });
                return;
              }
            }
          } catch {
          }
        }
        sendResponse({ success: true, translatedText: text });
      });
      return true;
    }
    case "TFB_TRANSLATE_TO_LANGUAGE": {
      const { text, to = "hi", from = "auto" } = message;
      getAuthConfig().then(async (cfg) => {
        try {
          const endpoint = `${cfg.appUrl}/api/translate`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, from, to })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.translatedText) {
              sendResponse({ success: true, translatedText: data.translatedText });
              return;
            }
          }
        } catch {
        }
        sendResponse({ success: false, error: "TRANSLATION_FAILED", translatedText: "" });
      });
      return true;
    }
    case "SPEAK_REQUEST": {
      const { text, language } = message;
      if (!text) {
        sendResponse({ success: false });
        return false;
      }
      const safeLang = sanitizeLanguage(language);
      const langTag = getLanguageBcp47(safeLang);
      try {
        if (chrome.tts && typeof chrome.tts.speak === "function") {
          chrome.tts.stop();
          chrome.tts.speak(text, {
            lang: langTag,
            rate: 1,
            onEvent: (event) => {
              if (event.type === "error") {
                console.warn("[TechFormBuddy TTS Error]:", event.errorMessage);
              }
            }
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, reason: "NO_VOICE_API" });
        }
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return false;
    }
    case "STOP_SPEAK_REQUEST": {
      try {
        if (chrome.tts && typeof chrome.tts.stop === "function") {
          chrome.tts.stop();
        }
      } catch {
      }
      sendResponse({ success: true });
      return false;
    }
    case "TFB_VOICE_INTENT": {
      const { transcript, language, currentPath } = message;
      getAuthConfig().then(async (cfg) => {
        try {
          const endpoint = `${cfg.appUrl}/api/voice-intent`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}
            },
            body: JSON.stringify({ transcript, language: language || cfg.language || "en", currentPath })
          });
          if (res.ok) {
            const data = await res.json();
            sendResponse({ success: true, intent: data });
            return;
          }
        } catch (err) {
          sendResponse({ success: false, error: err.message });
          return;
        }
        sendResponse({ success: false });
      });
      return true;
    }
    case "TFB_HIDE_SITE": {
      const { siteHost } = message;
      if (siteHost) {
        chrome.storage.local.get(["tfb_hidden_sites"], (res) => {
          const hiddenSites = res.tfb_hidden_sites || {};
          hiddenSites[siteHost] = true;
          chrome.storage.local.set({ tfb_hidden_sites: hiddenSites }, () => {
            sendResponse({ success: true, hiddenSites });
          });
        });
        return true;
      }
      sendResponse({ success: false });
      return false;
    }
    case "TFB_SHOW_EVERYWHERE": {
      chrome.storage.local.set({ tfb_hidden_sites: {}, tfb_hide_everywhere: false }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
    case "TFB_SHOW_BUDDY_ACTIVE_TAB": {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "TFB_SHOW_BUDDY" }, () => {
            if (chrome.runtime.lastError) {
            }
          });
        }
      });
      sendResponse({ success: true });
      return false;
    }
    case "TFB_TOGGLE_VISIBILITY_ACTIVE_TAB": {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: "TFB_TOGGLE_VISIBILITY" }, () => {
            if (chrome.runtime.lastError) {
            }
          });
        }
      });
      sendResponse({ success: true });
      return false;
    }
    default:
      sendResponse({ error: "UNKNOWN_MESSAGE_TYPE" });
      return false;
  }
});
try {
  chrome.runtime.onInstalled.addListener(() => {
    try {
      chrome.contextMenus.create({
        id: "tfb-toggle-buddy",
        title: "Show TechForm Buddy",
        contexts: ["all"]
      });
    } catch {
    }
  });
} catch {
}
try {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "tfb-toggle-buddy" && tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: "TFB_SHOW_BUDDY" }, () => {
        if (chrome.runtime.lastError) {
        }
      });
    }
  });
} catch {
}
try {
  if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === "toggle-buddy") {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: "TFB_TOGGLE_VISIBILITY" }, () => {
            if (chrome.runtime.lastError) {
            }
          });
        }
      }
    });
  }
} catch {
}
