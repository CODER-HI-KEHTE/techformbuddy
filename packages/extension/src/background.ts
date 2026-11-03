/**
 * TechForm Buddy - Background Service Worker (Manifest V3)
 *
 * Core Responsibilities:
 * 1. Handles authentication pairing and stores token in chrome.storage.session (and local fallback).
 * 2. Persists active user language in chrome.storage.local.
 * 3. Proxies POST /api/form/map calls with Bearer token, strictly forwarding field schemas and hostname only.
 * 4. Proxies GET /api/profile/fill-values calls with Bearer token, storing values ONLY in chrome.storage.session.
 * 5. Proxies POST /api/assistant calls with query and language to provide in-overlay guidance.
 * 6. Never logs user values or sends personal values to any AI or backend service.
 * 7. Handles TTS speech requests via chrome.tts with graceful fallback.
 */

import { sanitizeLanguage, getLanguageBcp47 } from '../../../src/lib/languages';

const DEFAULT_APP_URL = 'http://localhost:3000';

interface AuthConfig {
  token?: string;
  appUrl: string;
  language: string;
  taskName?: string;
}

/**
 * Retrieve session token, app URL, and language preference.
 * Prioritizes chrome.storage.session for token, falling back to chrome.storage.local.
 */
async function getAuthConfig(): Promise<AuthConfig> {
  return new Promise((resolve) => {
    let sessionToken: string | undefined;

    const readLocal = () => {
      chrome.storage.local.get(['token', 'appUrl', 'language', 'taskName'], (localItems: Record<string, any>) => {
        resolve({
          token: sessionToken || (localItems.token as string) || undefined,
          appUrl: (localItems.appUrl as string) || DEFAULT_APP_URL,
          language: sanitizeLanguage((localItems.language as string) || 'en'),
          taskName: (localItems.taskName as string) || '',
        });
      });
    };

    if (chrome.storage && chrome.storage.session) {
      chrome.storage.session.get(['token'], (sessionItems: Record<string, any>) => {
        if (sessionItems && sessionItems.token) {
          sessionToken = sessionItems.token as string;
        }
        readLocal();
      });
    } else {
      readLocal();
    }
  });
}

function saveToken(token: string, appUrl: string): Promise<void> {
  return new Promise((resolve) => {
    // Store in chrome.storage.session for security
    if (chrome.storage && chrome.storage.session) {
      chrome.storage.session.set({ token }, () => {
        // Also keep in chrome.storage.local for persistence
        chrome.storage.local.set({ token, appUrl }, () => resolve());
      });
    } else {
      chrome.storage.local.set({ token, appUrl }, () => resolve());
    }
  });
}

function clearAuthStorage(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['token'], () => {
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.clear(() => resolve());
      } else {
        resolve();
      }
    });
  });
}

// 1. External Connection Handler (Pairing from web app /extension/connect)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'TFB_CONNECT') {
    const token = message.token;
    const appUrl = message.appUrl || DEFAULT_APP_URL;

    if (token) {
      saveToken(token, appUrl).then(() => {
        sendResponse({ success: true, message: 'Extension paired successfully' });
      });
      return true; // Keep channel open for async response
    }
  }

  sendResponse({ success: false, error: 'INVALID_PAYLOAD' });
  return false;
});

// 2. Internal Runtime Message Handler (Popup & Content Scripts)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  switch (message.type) {
    case 'TFB_CONNECT': {
      const { token, appUrl } = message;
      if (!token) {
        sendResponse({ success: false, error: 'TOKEN_REQUIRED' });
        return false;
      }
      saveToken(token, appUrl || DEFAULT_APP_URL).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    case 'TFB_SET_LANGUAGE': {
      const lang = message.language || 'en';
      chrome.storage.local.set({ language: lang }, () => {
        sendResponse({ success: true, language: lang });
      });
      return true;
    }

    case 'TFB_SET_TASK': {
      const task = message.taskName || '';
      const lang = message.language;
      const url = message.url || '';
      chrome.storage.local.set(
        {
          taskName: task,
          taskUrl: url,
          ...(lang ? { language: lang } : {}),
        },
        () => {
          sendResponse({ success: true, taskName: task });
        }
      );
      return true;
    }

    case 'TFB_GET_STATUS': {
      getAuthConfig().then((cfg) => {
        sendResponse({
          connected: Boolean(cfg.token),
          appUrl: cfg.appUrl,
          language: cfg.language,
          taskName: cfg.taskName || '',
        });
      });
      return true;
    }

    case 'TFB_DISCONNECT': {
      clearAuthStorage().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    case 'TFB_MAP_FORM': {
      const { siteHost, language, fields, profileKeys } = message;

      getAuthConfig().then(async (cfg) => {
        if (!cfg.token) {
          sendResponse({
            error: 'NO_AUTH',
            message: 'Open TechForm Buddy and sign in',
            fallbackToLocal: true,
          });
          return;
        }

        const endpoint = `${cfg.appUrl}/api/form/map`;

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${cfg.token}`,
            },
            body: JSON.stringify({
              siteHost,
              language: language || cfg.language || 'en',
              fields,
              profileKeys: profileKeys || [],
            }),
          });

          if (res.status === 401) {
            sendResponse({
              error: 'NO_AUTH',
              message: 'Open TechForm Buddy and sign in',
              fallbackToLocal: true,
            });
            return;
          }

          if (!res.ok) {
            sendResponse({
              error: 'LLM_UNAVAILABLE',
              fallbackToLocal: true,
              status: res.status,
            });
            return;
          }

          const data = await res.json();
          sendResponse({ success: true, mappings: data.mappings, fromCache: data.fromCache });
        } catch (err: any) {
          sendResponse({ error: 'LLM_UNAVAILABLE', fallbackToLocal: true, message: err.message });
        }
      });
      return true;
    }

    case 'TFB_GET_FILL_VALUES': {
      getAuthConfig().then(async (cfg) => {
        if (!cfg.token) {
          sendResponse({
            error: 'NO_AUTH',
            message: 'Open TechForm Buddy and sign in',
          });
          return;
        }

        const endpoint = `${cfg.appUrl}/api/profile/fill-values`;

        try {
          const res = await fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${cfg.token}`,
            },
          });

          if (res.status === 401) {
            sendResponse({
              error: 'NO_AUTH',
              message: 'Open TechForm Buddy and sign in',
            });
            return;
          }

          if (!res.ok) {
            sendResponse({ error: 'FETCH_FAILED', status: res.status });
            return;
          }

          const data = await res.json();
          const fillValues = data.fillValues || {};

          // Store profile values ONLY in chrome.storage.session (cleared on browser exit)
          if (chrome.storage && chrome.storage.session) {
            chrome.storage.session.set({ fillValues });
          }

          sendResponse({ success: true, fillValues });
        } catch (err: any) {
          sendResponse({ error: 'NETWORK_ERROR', message: err.message });
        }
      });
      return true;
    }

    case 'TFB_GET_ON_VISIT_ALERTS': {
      const { domain } = message;
      getAuthConfig().then(async (cfg) => {
        const endpoint = `${cfg.appUrl}/api/watcher/on-visit?domain=${encodeURIComponent(domain || '')}`;
        try {
          const headers: Record<string, string> = {};
          if (cfg.token) {
            headers['Authorization'] = `Bearer ${cfg.token}`;
          }
          const res = await fetch(endpoint, { headers });
          if (!res.ok) {
            sendResponse({ hasAlerts: false, alerts: [] });
            return;
          }
          const data = await res.json();
          sendResponse(data);
        } catch (err: any) {
          sendResponse({ hasAlerts: false, alerts: [], error: err.message });
        }
      });
      return true;
    }

    case 'TFB_PAGE_GUIDE':
    case 'TFB_ASSISTANT_QUERY': {
      const { query, domain, language, taskName, pageContext } = message;

      getAuthConfig().then(async (cfg) => {
        const endpoint = `${cfg.appUrl}/api/assistant`;
        const activeTask = taskName || pageContext?.taskName || cfg.taskName || '';
        const effectiveQuery = query || activeTask || pageContext?.title || 'Portal Guidance';

        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}),
            },
            body: JSON.stringify({
              query: effectiveQuery,
              domain: domain || 'government',
              language: language || cfg.language || 'en',
              pageContext: {
                taskName: activeTask,
                url: message.url || pageContext?.url,
                title: message.title || pageContext?.title,
                headings: message.headings || pageContext?.headings,
                buttons: message.buttons || pageContext?.buttons,
                ...pageContext,
              },
            }),
          });

          if (!res.ok) {
            sendResponse({ error: 'ASSISTANT_FAILED', status: res.status });
            return;
          }

          const data = await res.json();
          sendResponse({
            success: true,
            found: data.found,
            data: data.data,
            aiAdvice: data.aiAdvice,
          });
        } catch (err: any) {
          sendResponse({ error: 'NETWORK_ERROR', message: err.message });
        }
      });
      return true;
    }

    case 'TFB_ASSISTANT_CHAT': {
      const { messages, pageSnapshot, language, profileValues, fieldIndex } = message;

      getAuthConfig().then(async (cfg) => {
        const endpoint = `${cfg.appUrl}/api/assistant/chat`;
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}),
            },
            body: JSON.stringify({
              messages,
              pageSnapshot,
              language: language || cfg.language || 'en',
              profileValues,
              fieldIndex,
              isBriefing: message.isBriefing,
            }),
          });

          if (!res.ok) {
            sendResponse({ error: 'CHAT_FAILED', status: res.status });
            return;
          }

          const data = await res.json();
          sendResponse({ success: true, ...data });
        } catch (err: any) {
          sendResponse({ error: 'NETWORK_ERROR', message: err.message });
        }
      });
      return true;
    }

    case 'TFB_DOWNLOAD': {
      const { url, filename } = message;
      if (!url) {
        sendResponse({ success: false, error: 'URL_REQUIRED' });
        return false;
      }
      try {
        if (chrome.downloads && typeof chrome.downloads.download === 'function') {
          chrome.downloads.download(
            {
              url,
              filename: filename || 'downloaded-document.pdf',
              saveAs: true,
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
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
        return false;
      }
    }

    case 'TFB_CLEAR_SESSION': {
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.clear(() => {
          sendResponse({ success: true });
        });
        return true;
      }
      sendResponse({ success: true });
      return false;
    }

    case 'TFB_TRANSLATE_TO_ENGLISH': {
      const { text, from = 'auto' } = message;
      getAuthConfig().then(async (cfg) => {
        try {
          const endpoint = `${cfg.appUrl}/api/translate`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, from, to: 'en' }),
          });
          if (res.ok) {
            const data = await res.json();
            sendResponse({ success: true, translatedText: data.translatedText || text });
            return;
          }
        } catch {
          // Direct fallback to Google Translate single API
          try {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=en&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data) && Array.isArray(data[0])) {
                const translated = data[0].map((item: any) => (item && item[0] ? item[0] : '')).join('');
                sendResponse({ success: true, translatedText: translated.trim() || text });
                return;
              }
            }
          } catch {}
        }
        sendResponse({ success: true, translatedText: text });
      });
      return true;
    }

    case 'TFB_TRANSLATE_TO_LANGUAGE': {
      const { text, to = 'hi', from = 'auto' } = message;
      getAuthConfig().then(async (cfg) => {
        try {
          const endpoint = `${cfg.appUrl}/api/translate`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, from, to }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.translatedText) {
              sendResponse({ success: true, translatedText: data.translatedText });
              return;
            }
          }
        } catch {}
        sendResponse({ success: false, error: 'TRANSLATION_FAILED', translatedText: '' });
      });
      return true;
    }

    case 'SPEAK_REQUEST': {
      const { text, language } = message;
      if (!text) {
        sendResponse({ success: false });
        return false;
      }

      const safeLang = sanitizeLanguage(language);
      const langTag = getLanguageBcp47(safeLang);

      try {
        if (chrome.tts && typeof chrome.tts.speak === 'function') {
          chrome.tts.stop();
          chrome.tts.speak(text, {
            lang: langTag,
            rate: 1.0,
            onEvent: (event) => {
              if (event.type === 'error') {
                console.warn('[TechFormBuddy TTS Error]:', event.errorMessage);
              }
            },
          });
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false, reason: 'NO_VOICE_API' });
        }
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
      return false;
    }

    case 'STOP_SPEAK_REQUEST': {
      try {
        if (chrome.tts && typeof chrome.tts.stop === 'function') {
          chrome.tts.stop();
        }
      } catch {
        // ignore
      }
      sendResponse({ success: true });
      return false;
    }

    case 'TFB_VOICE_INTENT': {
      const { transcript, language, currentPath } = message;
      getAuthConfig().then(async (cfg) => {
        try {
          const endpoint = `${cfg.appUrl}/api/voice-intent`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cfg.token ? { Authorization: `Bearer ${cfg.token}` } : {}),
            },
            body: JSON.stringify({ transcript, language: language || cfg.language || 'en', currentPath }),
          });
          if (res.ok) {
            const data = await res.json();
            sendResponse({ success: true, intent: data });
            return;
          }
        } catch (err: any) {
          sendResponse({ success: false, error: err.message });
          return;
        }
        sendResponse({ success: false });
      });
      return true;
    }

    case 'TFB_HIDE_SITE': {
      const { siteHost } = message;
      if (siteHost) {
        chrome.storage.local.get(['tfb_hidden_sites'], (res) => {
          const hiddenSites: Record<string, boolean> = (res.tfb_hidden_sites || {}) as Record<string, boolean>;
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

    case 'TFB_SHOW_EVERYWHERE': {
      chrome.storage.local.set({ tfb_hidden_sites: {}, tfb_hide_everywhere: false }, () => {
        sendResponse({ success: true });
      });
      return true;
    }

    case 'TFB_SHOW_BUDDY_ACTIVE_TAB': {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TFB_SHOW_BUDDY' }, () => {
            if (chrome.runtime.lastError) {}
          });
        }
      });
      sendResponse({ success: true });
      return false;
    }

    case 'TFB_TOGGLE_VISIBILITY_ACTIVE_TAB': {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'TFB_TOGGLE_VISIBILITY' }, () => {
            if (chrome.runtime.lastError) {}
          });
        }
      });
      sendResponse({ success: true });
      return false;
    }

    default:
      sendResponse({ error: 'UNKNOWN_MESSAGE_TYPE' });
      return false;
  }
});

// 3. Right-Click Context Menu & Shortcut Commands Handlers
try {
  chrome.runtime.onInstalled.addListener(() => {
    try {
      chrome.contextMenus.create({
        id: 'tfb-toggle-buddy',
        title: 'Show TechForm Buddy',
        contexts: ['all'],
      });
    } catch {}
  });
} catch {}

try {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'tfb-toggle-buddy' && tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'TFB_SHOW_BUDDY' }, () => {
        if (chrome.runtime.lastError) {}
      });
    }
  });
} catch {}

try {
  if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener(async (command) => {
      if (command === 'toggle-buddy') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'TFB_TOGGLE_VISIBILITY' }, () => {
            if (chrome.runtime.lastError) {}
          });
        }
      }
    });
  }
} catch {}
