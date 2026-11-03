/**
 * TechForm Buddy - Web App Detection, Language & Auth Pairing Content Script
 *
 * Runs strictly on our own web application origin (http://localhost:3000, *.techformbuddy.com).
 * Responsibilities:
 * 1. Sets documentElement.dataset.tfbExtension so the app knows the extension is installed.
 * 2. Continuously synchronizes selected language with background service worker (chrome.storage.local).
 * 3. Handles "Open with Buddy" triggers and syncs active language before opening portal.
 * 4. Securely forwards authentication tokens into background service worker (chrome.storage.session).
 */

// 1. Signal presence to web app after page has loaded (preventing React hydration mismatches on <html>)
try {
  // Remove legacy bearer tokens previously stored by older extension builds.
  localStorage.removeItem('tfb_ext_token');
} catch {
  // Ignore storage access failures.
}

function signalExtensionPresence() {
  try {
    const version = chrome.runtime.getManifest().version;
    // Set dataset attribute on <html> only after page load / hydration
    document.documentElement.dataset.tfbExtension = version;
    // Also broadcast presence via custom event and postMessage
    window.dispatchEvent(new CustomEvent('tfb-extension-ready', { detail: { version } }));
    window.postMessage({ type: 'TFB_EXTENSION_READY', version }, '*');
  } catch {
    // Ignore context error
  }
}

if (document.readyState === 'complete') {
  setTimeout(signalExtensionPresence, 0);
} else {
  window.addEventListener('load', () => {
    setTimeout(signalExtensionPresence, 0);
  });
}

// 2. Language Synchronization
function getAppLanguage(): string {
  try {
    return localStorage.getItem('tfb_lang') || localStorage.getItem('tfb_language') || 'en';
  } catch {
    return 'en';
  }
}

let lastSyncedLanguage = '';

function sendLanguageToBackground(lang: string) {
  if (!lang || lang === lastSyncedLanguage) return;
  lastSyncedLanguage = lang;
  try {
    chrome.runtime.sendMessage({ type: 'TFB_SET_LANGUAGE', language: lang }, () => {
      // Consume lastError to avoid unchecked runtime error
      if (chrome.runtime.lastError) {
        // Background worker might be sleeping
      }
    });
  } catch (err) {
    console.debug('[TechFormBuddy] Language sync warning:', err);
  }
}

// Sync language immediately on script load
const initialLang = getAppLanguage();
sendLanguageToBackground(initialLang);

// Listen to storage events (triggered across tabs)
window.addEventListener('storage', (event) => {
  if (event.key === 'tfb_lang' || event.key === 'tfb_language') {
    if (event.newValue) {
      sendLanguageToBackground(event.newValue);
    }
  }
});

// Periodic check on active tab in case localStorage changed in-page
setInterval(() => {
  const currentLang = getAppLanguage();
  if (currentLang && currentLang !== lastSyncedLanguage) {
    sendLanguageToBackground(currentLang);
  }
}, 1000);

// 3. Window Message Handlers (for app communication)
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data) return;

  if (event.origin !== window.location.origin) return;
  const { type, language, url, requestId } = event.data;

  // Language update message from app UI
  if (type === 'TFB_SET_LANGUAGE') {
    if (language) {
      sendLanguageToBackground(language);
    }
  }

  // "Open with Buddy" button pressed in app
  if (type === 'TFB_OPEN_WITH_BUDDY') {
    const targetLang = language || getAppLanguage();
    sendLanguageToBackground(targetLang);
    const taskName = event.data.taskName || '';
    try {
      chrome.runtime.sendMessage(
        {
          type: 'TFB_SET_TASK',
          taskName,
          language: targetLang,
          url,
        },
        () => {
          if (chrome.runtime.lastError) {
            // Background worker might be sleeping
          }
        }
      );
    } catch {
      // Ignore context errors
    }
    console.log('[TechFormBuddy] "Open with Buddy" triggered with language:', targetLang, 'task:', taskName, 'portal:', url);
  }

  // Token pairing stays in the isolated content-script world; the page never receives the bearer token.
  if (type === 'TFB_REQUEST_CONNECT' && typeof requestId === 'string') {
    void (async () => {
      try {
        const response = await fetch('/api/extension/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Chrome Extension (Desktop)' }),
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Sign in to TechForm Buddy before connecting the extension.');
        const result = await response.json();
        const paired = await new Promise<{ success?: boolean }>((resolve, reject) => {
          chrome.runtime.sendMessage(
            { type: 'TFB_CONNECT', token: result.token, appUrl: window.location.origin },
            (runtimeResponse) => {
              if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
              else resolve(runtimeResponse || {});
            }
          );
        });
        if (!paired.success) throw new Error('The extension did not accept the connection request.');
        window.postMessage({ type: 'TFB_CONNECT_RESULT', requestId, success: true }, window.location.origin);
      } catch (error) {
        window.postMessage({
          type: 'TFB_CONNECT_RESULT',
          requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Extension connection failed.',
        }, window.location.origin);
      }
    })();
  }

  // Explicit disconnect
  if (type === 'TFB_DISCONNECT') {
    chrome.runtime.sendMessage({ type: 'TFB_DISCONNECT' });
  }
});

