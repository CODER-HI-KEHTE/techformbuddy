"use strict";
(() => {
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
  var LANG_CODE_TO_LABEL = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((l) => [l.code, l.label])
  );
  var LANG_CODE_TO_NATIVE = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((l) => [l.code, l.nativeName])
  );

  // packages/extension/src/popup.ts
  document.addEventListener("DOMContentLoaded", async () => {
    const badge = document.getElementById("conn-badge");
    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");
    const disconnectedAlert = document.getElementById("disconnected-alert");
    const btnPair = document.getElementById("btn-pair");
    const langSelect = document.getElementById("lang-select");
    if (langSelect) {
      langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
        (l) => `<option value="${l.code}">${l.label === l.nativeName ? l.label : `${l.label} (${l.nativeName})`}</option>`
      ).join("");
    }
    const btnStart = document.getElementById("btn-start");
    const btnStartText = document.getElementById("btn-start-text");
    const btnStartSpinner = document.getElementById("btn-start-spinner");
    const btnDisconnect = document.getElementById("btn-disconnect");
    const statusMsg = document.getElementById("status-msg");
    let appUrl = "http://localhost:3000";
    let isConnected = false;
    chrome.runtime.sendMessage({ type: "TFB_GET_STATUS" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        statusText.textContent = "Disconnected";
        badge.className = "connection-badge disconnected";
        disconnectedAlert.style.display = "block";
        return;
      }
      isConnected = response.connected;
      appUrl = response.appUrl || "http://localhost:3000";
      if (response.language) {
        langSelect.value = sanitizeLanguage(response.language);
      }
      if (isConnected) {
        badge.className = "connection-badge connected";
        statusText.textContent = "Connected";
        disconnectedAlert.style.display = "none";
        btnDisconnect.style.display = "block";
        btnStart.disabled = false;
      } else {
        badge.className = "connection-badge disconnected";
        statusText.textContent = "Not Paired";
        disconnectedAlert.style.display = "block";
        btnDisconnect.style.display = "none";
      }
    });
    langSelect.addEventListener("change", () => {
      const selectedLang = sanitizeLanguage(langSelect.value);
      chrome.storage.local.set({ language: selectedLang });
    });
    btnPair.addEventListener("click", () => {
      chrome.tabs.create({ url: `${appUrl}/extension/connect` });
    });
    btnDisconnect.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "TFB_DISCONNECT" }, () => {
        badge.className = "connection-badge disconnected";
        statusText.textContent = "Not Paired";
        disconnectedAlert.style.display = "block";
        btnDisconnect.style.display = "none";
        showStatus("Disconnected and cleared stored data", "success");
      });
    });
    const btnRestoreBuddy = document.getElementById("btn-restore-buddy");
    if (btnRestoreBuddy) {
      btnRestoreBuddy.addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: "TFB_SHOW_BUDDY" }, () => {
            if (chrome.runtime.lastError) {
            }
          });
        }
        chrome.runtime.sendMessage({ type: "TFB_SHOW_BUDDY_ACTIVE_TAB" });
        showStatus("TechForm Buddy restored on page!", "success");
        setTimeout(() => window.close(), 600);
      });
    }
    const btnShowEverywhere = document.getElementById("btn-show-everywhere");
    if (btnShowEverywhere) {
      btnShowEverywhere.addEventListener("click", async () => {
        chrome.runtime.sendMessage({ type: "TFB_SHOW_EVERYWHERE" }, () => {
          showStatus("Restored everywhere! Hidden site list cleared.", "success");
        });
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: "TFB_SHOW_BUDDY" }, () => {
            if (chrome.runtime.lastError) {
            }
          });
        }
      });
    }
    btnStart.addEventListener("click", async () => {
      btnStart.disabled = true;
      btnStartText.textContent = "Scanning form...";
      btnStartSpinner.style.display = "inline-block";
      statusMsg.style.display = "none";
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          showStatus("No active browser tab found", "error");
          resetStartBtn();
          return;
        }
        if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("edge://")) {
          showStatus("Cannot run on internal browser pages", "error");
          resetStartBtn();
          return;
        }
        const selectedLanguage = langSelect.value || "en";
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["form-core.iife.js"]
        });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: runFormAssistance,
          args: [selectedLanguage]
        });
        const runnerResult = results?.[0]?.result;
        if (runnerResult && !runnerResult.success) {
          showStatus(runnerResult.message || "Form scan completed", runnerResult.success ? "success" : "error");
        } else {
          window.close();
        }
      } catch (err) {
        showStatus(err.message || "Failed to start form assistant", "error");
      } finally {
        resetStartBtn();
      }
    });
    function showStatus(text, type) {
      statusMsg.textContent = text;
      statusMsg.className = `status-msg ${type}`;
      statusMsg.style.display = "block";
    }
    function resetStartBtn() {
      btnStart.disabled = false;
      btnStartText.textContent = "\u{1F680} Start on this page";
      btnStartSpinner.style.display = "none";
    }
  });
  async function runFormAssistance(targetLanguage) {
    const core = window.TechFormBuddyCore;
    if (!core) {
      return { success: false, message: "Core form assistant could not be loaded" };
    }
    const schema = core.readForm();
    if (!schema.fields || schema.fields.length === 0) {
      return { success: false, message: "No form input fields detected on this page" };
    }
    const candidateKeys = [
      "full_name",
      "first_name",
      "last_name",
      "email",
      "phone",
      "date_of_birth",
      "gender",
      "address",
      "city",
      "state",
      "pincode",
      "country",
      "father_name",
      "mother_name",
      "blood_group",
      "emergency_contact",
      "marital_status",
      "occupation"
    ];
    const siteHost = window.location.hostname;
    let mappings = [];
    try {
      const mapResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            type: "TFB_MAP_FORM",
            siteHost,
            language: targetLanguage,
            fields: schema.fields,
            profileKeys: candidateKeys
          },
          resolve
        );
      });
      if (mapResponse?.success && Array.isArray(mapResponse.mappings)) {
        mappings = mapResponse.mappings;
      }
    } catch {
    }
    if (!mappings || mappings.length === 0) {
      const localAnalysis = core.analyzeForm(schema.fields, candidateKeys);
      mappings = localAnalysis.fields;
    }
    let profileValues = {};
    try {
      const fillResponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "TFB_GET_FILL_VALUES" }, resolve);
      });
      if (fillResponse?.success && fillResponse.fillValues) {
        profileValues = fillResponse.fillValues;
      }
    } catch {
      profileValues = {};
    }
    const bridge = new core.ChromeExtensionBridge();
    let taskName = "";
    try {
      const statusRes = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "TFB_GET_STATUS" }, resolve);
      });
      if (statusRes?.taskName) {
        taskName = statusRes.taskName;
      }
    } catch {
    }
    const overlay = core.mountOverlay({
      language: targetLanguage,
      taskName,
      bridge,
      onClose: () => {
        chrome.runtime.sendMessage({ type: "TFB_CLEAR_SESSION" });
      },
      onComplete: () => {
        chrome.runtime.sendMessage({ type: "TFB_CLEAR_SESSION" });
      }
    });
    overlay.setData(schema.fields, mappings, profileValues);
    if (!core.isRealForm(schema.fields)) {
      const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4")).filter((el) => el.offsetParent !== null && el.textContent?.trim()).map((el) => el.textContent.trim().replace(/\s+/g, " ")).slice(0, 15);
      const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], .btn, .card')).filter((el) => el.offsetParent !== null && el.textContent?.trim()).map((el) => el.textContent.trim().replace(/\s+/g, " ")).filter((txt) => txt.length > 2 && txt.length < 80).slice(0, 25);
      try {
        chrome.runtime.sendMessage({
          type: "TFB_PAGE_GUIDE",
          taskName,
          url: window.location.href,
          title: document.title,
          headings,
          buttons,
          language: targetLanguage
        }, (guideRes) => {
          if (guideRes && guideRes.data) {
            overlay.setGuideData({
              taskName: taskName || guideRes.data.title,
              title: guideRes.data.title,
              summary: guideRes.data.summary,
              steps: guideRes.data.guideSteps || (guideRes.data.steps || []).map((s, idx) => ({
                stepNumber: idx + 1,
                text: s,
                targetText: s.match(/["']([^"']+)["']/)?.[1]
              })),
              aiAdvice: guideRes.aiAdvice
            });
          }
        });
      } catch {
      }
    }
    return { success: true, fieldCount: schema.fields.length };
  }
})();
