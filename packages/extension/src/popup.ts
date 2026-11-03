/**
 * TechForm Buddy - Popup UI Controller
 */

import { SUPPORTED_LANGUAGES, sanitizeLanguage } from '../../../src/lib/languages';

document.addEventListener('DOMContentLoaded', async () => {
  const badge = document.getElementById('conn-badge')!;
  const statusDot = document.getElementById('status-dot')!;
  const statusText = document.getElementById('status-text')!;
  const disconnectedAlert = document.getElementById('disconnected-alert')!;
  const btnPair = document.getElementById('btn-pair')!;
  const langSelect = document.getElementById('lang-select') as HTMLSelectElement;

  // Initialize language dropdown strictly from shared config (Item 1)
  if (langSelect) {
    langSelect.innerHTML = SUPPORTED_LANGUAGES.map(
      (l) => `<option value="${l.code}">${l.label === l.nativeName ? l.label : `${l.label} (${l.nativeName})`}</option>`
    ).join('');
  }
  const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
  const btnStartText = document.getElementById('btn-start-text')!;
  const btnStartSpinner = document.getElementById('btn-start-spinner')!;
  const btnDisconnect = document.getElementById('btn-disconnect') as HTMLButtonElement;
  const statusMsg = document.getElementById('status-msg')!;

  let appUrl = 'http://localhost:3000';
  let isConnected = false;

  // 1. Fetch current connection status & language
  chrome.runtime.sendMessage({ type: 'TFB_GET_STATUS' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      statusText.textContent = 'Disconnected';
      badge.className = 'connection-badge disconnected';
      disconnectedAlert.style.display = 'block';
      return;
    }

    isConnected = response.connected;
    appUrl = response.appUrl || 'http://localhost:3000';

    if (response.language) {
      langSelect.value = sanitizeLanguage(response.language);
    }

    if (isConnected) {
      badge.className = 'connection-badge connected';
      statusText.textContent = 'Connected';
      disconnectedAlert.style.display = 'none';
      btnDisconnect.style.display = 'block';
      btnStart.disabled = false;
    } else {
      badge.className = 'connection-badge disconnected';
      statusText.textContent = 'Not Paired';
      disconnectedAlert.style.display = 'block';
      btnDisconnect.style.display = 'none';
    }
  });

  // 2. Language select change
  langSelect.addEventListener('change', () => {
    const selectedLang = sanitizeLanguage(langSelect.value);
    chrome.storage.local.set({ language: selectedLang });
  });

  // 3. Pair Account button
  btnPair.addEventListener('click', () => {
    chrome.tabs.create({ url: `${appUrl}/extension/connect` });
  });

  // 4. Disconnect button
  btnDisconnect.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'TFB_DISCONNECT' }, () => {
      badge.className = 'connection-badge disconnected';
      statusText.textContent = 'Not Paired';
      disconnectedAlert.style.display = 'block';
      btnDisconnect.style.display = 'none';
      showStatus('Disconnected and cleared stored data', 'success');
    });
  });

  // 4b. Restore Buddy on page
  const btnRestoreBuddy = document.getElementById('btn-restore-buddy');
  if (btnRestoreBuddy) {
    btnRestoreBuddy.addEventListener('click', async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TFB_SHOW_BUDDY' }, () => {
          if (chrome.runtime.lastError) {}
        });
      }
      chrome.runtime.sendMessage({ type: 'TFB_SHOW_BUDDY_ACTIVE_TAB' });
      showStatus('TechForm Buddy restored on page!', 'success');
      setTimeout(() => window.close(), 600);
    });
  }

  // 4c. Show Everywhere (reset all per-site hide flags)
  const btnShowEverywhere = document.getElementById('btn-show-everywhere');
  if (btnShowEverywhere) {
    btnShowEverywhere.addEventListener('click', async () => {
      chrome.runtime.sendMessage({ type: 'TFB_SHOW_EVERYWHERE' }, () => {
        showStatus('Restored everywhere! Hidden site list cleared.', 'success');
      });
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TFB_SHOW_BUDDY' }, () => {
          if (chrome.runtime.lastError) {}
        });
      }
    });
  }

  // 5. Start on this page button
  btnStart.addEventListener('click', async () => {
    btnStart.disabled = true;
    btnStartText.textContent = 'Scanning form...';
    btnStartSpinner.style.display = 'inline-block';
    statusMsg.style.display = 'none';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showStatus('No active browser tab found', 'error');
        resetStartBtn();
        return;
      }

      // Check URL protocol (cannot run on chrome:// or edge:// pages)
      if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('edge://')) {
        showStatus('Cannot run on internal browser pages', 'error');
        resetStartBtn();
        return;
      }

      const selectedLanguage = langSelect.value || 'en';

      // 5.1 Inject form-core.iife.js bundle into active tab (ISOLATED world)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['form-core.iife.js'],
      });

      // 5.2 Execute page runner in ISOLATED world
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: runFormAssistance,
        args: [selectedLanguage],
      });

      const runnerResult = results?.[0]?.result;
      if (runnerResult && !runnerResult.success) {
        showStatus(runnerResult.message || 'Form scan completed', runnerResult.success ? 'success' : 'error');
      } else {
        // Success: close popup so user sees the on-page guide overlay
        window.close();
      }
    } catch (err: any) {
      showStatus(err.message || 'Failed to start form assistant', 'error');
    } finally {
      resetStartBtn();
    }
  });

  function showStatus(text: string, type: 'error' | 'success') {
    statusMsg.textContent = text;
    statusMsg.className = `status-msg ${type}`;
    statusMsg.style.display = 'block';
  }

  function resetStartBtn() {
    btnStart.disabled = false;
    btnStartText.textContent = '🚀 Start on this page';
    btnStartSpinner.style.display = 'none';
  }
});

/**
 * Injected Runner Function: Runs in the tab's ISOLATED world.
 * Interacts with DOM and dispatches runtime messages to extension background service worker.
 */
async function runFormAssistance(targetLanguage: string) {
  const core = (window as any).TechFormBuddyCore;
  if (!core) {
    return { success: false, message: 'Core form assistant could not be loaded' };
  }

  // 1. Read Form Schema
  const schema = core.readForm();
  if (!schema.fields || schema.fields.length === 0) {
    return { success: false, message: 'No form input fields detected on this page' };
  }

  // Available profile keys candidate list (non-sensitive whitelist)
  const candidateKeys = [
    'full_name',
    'first_name',
    'last_name',
    'email',
    'phone',
    'date_of_birth',
    'gender',
    'address',
    'city',
    'state',
    'pincode',
    'country',
    'father_name',
    'mother_name',
    'blood_group',
    'emergency_contact',
    'marital_status',
    'occupation',
  ];

  const siteHost = window.location.hostname;

  // 2. Request AI Mapping from Extension Background Service Worker
  let mappings: any[] = [];
  try {
    const mapResponse = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: 'TFB_MAP_FORM',
          siteHost,
          language: targetLanguage,
          fields: schema.fields,
          profileKeys: candidateKeys,
        },
        resolve
      );
    });

    if (mapResponse?.success && Array.isArray(mapResponse.mappings)) {
      mappings = mapResponse.mappings;
    }
  } catch {
    // If background worker call fails, mappings remains empty to trigger local fallback
  }

  // 3. Fallback: If AI is unavailable or returned error, use local semantic analyzer
  if (!mappings || mappings.length === 0) {
    const localAnalysis = core.analyzeForm(schema.fields, candidateKeys);
    mappings = localAnalysis.fields;
  }

  // 4. Request profile fill values from background worker (from GET /api/profile/fill-values)
  let profileValues: Record<string, string> = {};
  try {
    const fillResponse = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({ type: 'TFB_GET_FILL_VALUES' }, resolve);
    });
    if (fillResponse?.success && fillResponse.fillValues) {
      profileValues = fillResponse.fillValues;
    }
  } catch {
    profileValues = {};
  }

  // 5. Mount Guide Overlay
  const bridge = new core.ChromeExtensionBridge();
  let taskName = '';
  try {
    const statusRes = await new Promise<any>((resolve) => {
      chrome.runtime.sendMessage({ type: 'TFB_GET_STATUS' }, resolve);
    });
    if (statusRes?.taskName) {
      taskName = statusRes.taskName;
    }
  } catch {}

  const overlay = core.mountOverlay({
    language: targetLanguage,
    taskName,
    bridge,
    onClose: () => {
      chrome.runtime.sendMessage({ type: 'TFB_CLEAR_SESSION' });
    },
    onComplete: () => {
      chrome.runtime.sendMessage({ type: 'TFB_CLEAR_SESSION' });
    },
  });

  // 6. Populate overlay data (fields, analysis/mappings, profileValues)
  overlay.setData(schema.fields, mappings, profileValues);

  // If no real form, query backend assistant for page guidance
  if (!core.isRealForm(schema.fields)) {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
      .filter((el: any) => el.offsetParent !== null && el.textContent?.trim())
      .map((el: any) => el.textContent.trim().replace(/\s+/g, ' '))
      .slice(0, 15);

    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], .btn, .card'))
      .filter((el: any) => el.offsetParent !== null && el.textContent?.trim())
      .map((el: any) => el.textContent.trim().replace(/\s+/g, ' '))
      .filter((txt: string) => txt.length > 2 && txt.length < 80)
      .slice(0, 25);

    try {
      chrome.runtime.sendMessage({
        type: 'TFB_PAGE_GUIDE',
        taskName,
        url: window.location.href,
        title: document.title,
        headings,
        buttons,
        language: targetLanguage,
      }, (guideRes) => {
        if (guideRes && guideRes.data) {
          overlay.setGuideData({
            taskName: taskName || guideRes.data.title,
            title: guideRes.data.title,
            summary: guideRes.data.summary,
            steps: guideRes.data.guideSteps || (guideRes.data.steps || []).map((s: string, idx: number) => ({
              stepNumber: idx + 1,
              text: s,
              targetText: s.match(/["']([^"']+)["']/)?.[1],
            })),
            aiAdvice: guideRes.aiAdvice,
          });
        }
      });
    } catch {}
  }

  return { success: true, fieldCount: schema.fields.length };
}
