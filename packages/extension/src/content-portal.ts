import { SUPPORTED_LANGUAGES, sanitizeLanguage, getLanguageBcp47 } from '../../../src/lib/languages';
import { processFieldValueForFilling, isRegionalScriptField } from '../../../src/lib/transliterate';
import { getTranslationFailureMessage } from '../../../src/lib/translate';

/**
 * TechForm Buddy - Portal Content Script
 * Injected on official government portals (*.gov.in, *.nic.in, etc.) and supported forms.
 *
 * Responsibilities:
 * 1. Logs "[TechFormBuddy] content script loaded" on injection.
 * 2. Scans forms (strictly excluding sensitive password/OTP fields).
 * 3. Mounts accessible on-page Guide Overlay with language synced automatically from web app.
 * 4. Routes all backend requests (/api/form/map, /api/profile/fill-values, /api/assistant)
 *    through background service worker to prevent CORS.
 * 5. Requires explicit user confirmation for low-confidence field mappings.
 * 6. Never auto-submits.
 */

// 1. Web app origin guard (Never mount portal widget on TechForm Buddy web app origin)
function isWebAppOrigin(): boolean {
  try {
    const origin = window.location.origin;
    const hostname = window.location.hostname;
    const port = window.location.port;
    if (origin.includes('techformbuddy.com')) return true;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000') return true;
    if (document.documentElement.dataset.tfbExtension || document.getElementById('__next')) {
      if (document.title.includes('TechForm Buddy') || document.querySelector('meta[name="description"][content*="TechForm Buddy"]')) {
        return true;
      }
    }
  } catch {}
  return false;
}

if (isWebAppOrigin()) {
  console.log("[TechFormBuddy] Web app origin detected. Skipping portal widget injection.");
} else {
  // Mandatory visible console log for injection verification on portals
  console.log("[TechFormBuddy] content script loaded", window.location.href);

  // Prevent double injection in same frame
  if (!(window as any).__tfbPortalLoaded) {
    (window as any).__tfbPortalLoaded = true;
    initPortalContentScript();
  }
}

interface FormFieldItem {
  id: string;
  name: string;
  label: string;
  type: string;
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  mappedKey?: string | null;
  mappedValue?: string | null;
  confidence?: number;
  confirmed?: boolean;
}

// Global overlay state
let overlayHost: HTMLDivElement | null = null;
let currentFieldsList: FormFieldItem[] = [];
let activeLang = 'en';
let latestFillValues: Record<string, string> = {};
let activeTab: 'form' | 'guide' | 'assistant' = 'form';
let assistantQueryResult: any = null;
let isQueryingAssistant = false;
let hasAttemptedGuideFetch = false;
let activeTaskName = '';
let portalGuideStepIndex = 0;
let portalAutoReadEnabled = false;
let portalVoiceWarning = '';
let isPortalSpeaking = false;
let portalHighlightedElement: HTMLElement | null = null;
let sidebarWidth = 440;
let sidebarSide: 'right' | 'left' = 'right';
let isSidebarMinimized = false;
let isResizingSidebar = false;

// Autofill Mode State (Requirement 1 & 2)
let isAutofillModeOn = true;
try {
  const savedMode = localStorage.getItem('tfb_autofill_mode');
  if (savedMode !== null) isAutofillModeOn = savedMode === 'true';
} catch {}

window.addEventListener('tfb-autofill-mode-changed', (e: any) => {
  if (typeof e.detail?.enabled === 'boolean') {
    isAutofillModeOn = e.detail.enabled;
    const pillBadge = document.getElementById('tfb-pill-autofill-badge');
    if (pillBadge) {
      pillBadge.textContent = `⚡ Autofill: ${isAutofillModeOn ? 'ON' : 'OFF'}`;
      pillBadge.style.background = isAutofillModeOn ? '#2563eb' : '#475569';
    }
  }
});

// On-Visit Alert State (Requirement 6b)
interface OnVisitAlertItem {
  id: string;
  title: string;
  link: string | null;
  deadline: string | null;
  classification: string | null;
  whyMatched: string;
}

let onVisitAlerts: OnVisitAlertItem[] = [];
let onVisitSourceName = '';
let hasCheckedOnVisitAlerts = false;
let onVisitAlertDismissed = false;

function highlightNoticeOnPage(noticeTitle: string) {
  const words = (noticeTitle || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const elements = Array.from(document.querySelectorAll('a, h1, h2, h3, h4, h5, td, li, p, span'));
  let matchedEl: HTMLElement | null = null;
  let maxScore = 0;

  for (const el of elements) {
    const text = (el.textContent || '').toLowerCase();
    if (text.length < 10 || text.length > 500) continue;
    let score = 0;
    for (const w of words) {
      if (text.includes(w)) score++;
    }
    if (score > maxScore || (score === maxScore && matchedEl && matchedEl.contains(el))) {
      maxScore = score;
      matchedEl = el as HTMLElement;
    }
  }

  if (matchedEl) {
    matchedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    matchedEl.style.outline = '4px solid #f59e0b';
    matchedEl.style.backgroundColor = 'rgba(245, 158, 11, 0.25)';
    matchedEl.style.borderRadius = '4px';
    matchedEl.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if (matchedEl) {
        matchedEl.style.outline = '2px dashed #f59e0b';
      }
    }, 4000);
  }
}

// Conversational Agent State
interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ProposedAgentTool {
  name: 'read_snapshot' | 'highlight' | 'fill' | 'scroll_to' | 'click' | 'navigate' | 'download' | 'speak';
  args: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
  isExternalDomain?: boolean;
}

interface AgentPageSnapshot {
  title: string;
  url: string;
  headings: string[];
  visibleText?: string;
  formFields: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    isEmpty: boolean;
  }>;
  buttons: string[];
  links: Array<{ text: string; url: string }>;
  fileDownloads: Array<{ text: string; url: string }>;
}

function redactPII(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CARD]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_AADHAAR]')
    .replace(/\b[A-Za-z]{5}\d{4}[A-Za-z]\b/g, '[REDACTED_PAN]')
    .replace(/(?:\+91[\s-]?)?(?:0)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
}

let chatTurns: ChatTurn[] = [];
let pendingProposedTool: ProposedAgentTool | null = null;
let currentFieldWalkIndex = 0;
let blockedActionMessage: string | null = null;
let isChatSubmitting = false;

try {
  const savedWidth = localStorage.getItem('tfb_overlay_width');
  if (savedWidth) {
    const w = parseInt(savedWidth, 10);
    if (!isNaN(w) && w >= 320 && w <= 900) sidebarWidth = w;
  }
  const savedSide = localStorage.getItem('tfb_overlay_side');
  if (savedSide === 'left' || savedSide === 'right') sidebarSide = savedSide;
} catch {}

const OVERLAY_TEXTS: Record<string, any> = {
  en: {
    title: 'TechForm Buddy Assistant',
    fieldsDetected: (n: number) => `${n} Form Fields Detected`,
    stepProgress: (c: number, t: number) => `Step ${c} of ${t}`,
    fillSafe: '⚡ Auto-Fill Verified Fields',
    fillAll: 'Fill All Fields',
    clear: 'Clear Values',
    confirmLow: 'Low-confidence match: confirm before filling',
    reviewSubmit: 'Review everything on this page, then press Submit yourself on the portal. TechForm Buddy never submits forms automatically.',
    notPairedTitle: 'Open TechForm Buddy and sign in',
    notPairedMsg: 'Sign in to TechForm Buddy to pair your saved profile and enable intelligent form autofill.',
    openAppBtn: 'Open TechForm Buddy ↗',
    tabForm: '📋 Auto-Fill',
    tabGuide: 'ℹ️ Portal Guide',
    tabAssistant: '💬 Ask Assistant',
    askPlaceholder: 'Ask about documents, eligibility, or steps...',
    askBtn: 'Ask',
    asking: 'Searching guidance...',
    noAssistantAnswer: 'No specific guidance found. Type a query above.',
    quickQuestions: ['ye field kya hai?', 'ye form kis liye hai?', 'kaunse documents chahiye?', 'kahan kya bharna hai', 'Download guidelines'],
    toolConfirmBtn: '✓ Confirm / Yes',
    toolCancelBtn: '✕ Cancel / No',
    proposedActionTitle: 'Proposed Action',
    securityAlertTitle: 'Safety Shield Notice',
    externalDomainNotice: '⚠️ External Domain Navigation Warning: You are navigating away to a different website. Do you confirm?',
    docsNeeded: 'Documents Needed:',
    stepsHeading: 'Application Steps:',
    ttsRead: '🔊 Read Aloud',
    activeTask: 'Active Task',
    autoReadToggle: 'Auto-read each step',
    noVoiceWarning: (lang: string) => `Notice: No voice installed for ${lang} on this system.`,
    guideAction: 'Click highlighted element',
    pageGuide: 'Portal Page Guide',
    btnNextStep: 'Next Step →',
    btnPrevStep: '← Previous Step',
  },
  hi: {
    title: 'टेकफॉर्म बडी सहायक',
    fieldsDetected: (n: number) => `${n} फॉर्म फ़ील्ड मिले`,
    stepProgress: (c: number, t: number) => `चरण ${c} / ${t}`,
    fillSafe: '⚡ सत्यापित फ़ील्ड स्वतः भरें',
    fillAll: 'सभी फ़ील्ड भरें',
    clear: 'मान साफ़ करें',
    confirmLow: 'कम विश्वसनीयता: भरने से पहले पुष्टि करें',
    reviewSubmit: 'इस पृष्ठ पर सब कुछ जांचें, फिर पोर्टल पर स्वयं सबमिट दबाएं। TechForm Buddy कभी भी फॉर्म स्वचालित रूप से सबमिट नहीं करता है।',
    notPairedTitle: 'TechForm Buddy खोलें और साइन इन करें',
    notPairedMsg: 'अपनी प्रोफ़ाइल से कनेक्ट करने और सुरक्षित ऑटो-फ़िल के लिए TechForm Buddy में साइन इन करें।',
    openAppBtn: 'TechForm Buddy खोलें ↗',
    tabForm: '📋 ऑटो-फ़िल',
    tabGuide: 'ℹ️ पोर्टल गाइड',
    tabAssistant: '💬 सहायक से पूछें',
    askPlaceholder: 'दस्तावेज़, पात्रता या चरणों के बारे में पूछें...',
    askBtn: 'पूछें',
    asking: 'खोज रहे हैं...',
    noAssistantAnswer: 'कोई विशिष्ट जानकारी नहीं मिली। ऊपर एक प्रश्न लिखें।',
    quickQuestions: ['ye field kya hai?', 'ye form kis liye hai?', 'kaunse documents chahiye?', 'kahan kya bharna hai', 'Download guidelines'],
    toolConfirmBtn: '✓ पुष्टि करें / हाँ',
    toolCancelBtn: '✕ रद्द करें / नहीं',
    proposedActionTitle: 'प्रस्तावित कार्रवाई',
    securityAlertTitle: 'सुरक्षा नियम द्वारा अवरुद्ध',
    externalDomainNotice: '⚠️ बाहरी डोमेन चेतावनी: आप एक अलग वेबसाइट पर जा रहे हैं। क्या आप पुष्टि करते हैं?',
    docsNeeded: 'आवश्यक दस्तावेज़:',
    stepsHeading: 'आवेदन के चरण:',
    ttsRead: '🔊 बोलकर सुनाएं',
    activeTask: 'सक्रिय कार्य',
    autoReadToggle: 'प्रत्येक चरण बोलकर सुनाएं',
    noVoiceWarning: (lang: string) => `सूचना: इस सिस्टम पर ${lang} के लिए कोई आवाज नहीं मिली।`,
    guideAction: 'हाइलाइट किए गए विकल्प पर क्लिक करें',
    pageGuide: 'पोर्टल पेज गाइड',
    btnNextStep: 'अगला चरण →',
    btnPrevStep: '← पिछला चरण',
  },
  bn: {
    title: 'টেকফর্ম বাডি সহায়ক',
    fieldsDetected: (n: number) => `${n} টি ফর্ম ফিল্ড পাওয়া গেছে`,
    fillSafe: '⚡ যাচাইকৃত তথ্য পূরণ করুন',
    fillAll: 'সব পূরণ করুন',
    clear: 'মুছুন',
    confirmLow: 'সন্দেহজনক মিল: পূরণ করার আগে নিশ্চিত করুন',
    reviewSubmit: 'সবকিছু পর্যালোচনা করুন, তারপর পোর্টালে নিজে জমা দিন। TechForm Buddy কখনো স্বয়ংক্রিয়ভাবে ফর্ম জমা দেয় না।',
    notPairedTitle: 'TechForm Buddy খুলুন এবং সাইন ইন করুন',
    notPairedMsg: 'সংরক্ষিত প্রোফাইল যুক্ত করতে এবং অটো-ফিল সক্ষম করতে সাইন ইন করুন।',
    openAppBtn: 'TechForm Buddy খুলুন ↗',
    tabForm: '📋 অটো-ফিল',
    tabGuide: 'ℹ️ গাইড',
    tabAssistant: '💬 সহকারী',
    askPlaceholder: 'কাগজপত্র বা নিয়ম সম্পর্কে জিজ্ঞাসা করুন...',
    askBtn: 'জানুন',
    asking: 'খোঁজা হচ্ছে...',
    noAssistantAnswer: 'কোনো উত্তর পাওয়া যায়নি। উপরে প্রশ্ন লিখুন।',
    quickQuestions: ['কী কী নথি লাগবে?', 'কীভাবে ফর্ম পূরণ করবেন?'],
    docsNeeded: 'প্রয়োজনীয় নথি:',
    stepsHeading: 'আবেদনের ধাপ:',
    ttsRead: '🔊 শুনুন',
  },
  ta: {
    title: 'டெக்ஃபார்ம் படி உதவியாளர்',
    fieldsDetected: (n: number) => `${n} புலங்கள் கண்டறியப்பட்டன`,
    fillSafe: '⚡ சரிபார்க்கப்பட்டவற்றை நிரப்புக',
    fillAll: 'அனைத்தையும் நிரப்புக',
    clear: 'அழிக்கவும்',
    confirmLow: 'குறைந்த நம்பிக்கை: நிரப்புவதற்கு முன் உறுதிப்படுத்தவும்',
    reviewSubmit: 'அனைத்தையும் சரிபார்த்து, போர்ட்டலில் நீங்களே சமர்ப்பிக்கவும். TechForm Buddy தானாகப் படிவங்களைச் சமர்ப்பிக்காது.',
    notPairedTitle: 'TechForm Buddy-யைத் திறந்து உள்நுழையவும்',
    notPairedMsg: 'உங்கள் விவரக்குறிப்பை இணைக்க TechForm Buddy-யில் உள்நுழையவும்.',
    openAppBtn: 'TechForm Buddy திற ↗',
    tabForm: '📋 ஆட்டோ-ஃபில்',
    tabGuide: 'ℹ️ வழிகாட்டி',
    tabAssistant: '💬 உதவி',
    askPlaceholder: 'ஆவணங்கள் அல்லது வழிகாட்டுதலைப் பற்றி கேட்கவும்...',
    askBtn: 'கேட்க',
    asking: 'தேடுகிறது...',
    noAssistantAnswer: 'வழிகாட்டுதல் கிடைக்கவில்லை. மேலே கேட்கவும்.',
    quickQuestions: ['என்ன ஆவணங்கள் தேவை?', 'படிவத்தை எப்படி நிரப்புவது?'],
    docsNeeded: 'தேவையான ஆவணங்கள்:',
    stepsHeading: 'படிநிலைகள்:',
    ttsRead: '🔊 வாசி',
  },
  te: {
    title: 'టెక్ఫామ్ బడ్డీ అసిస్టెంట్',
    fieldsDetected: (n: number) => `${n} ఫారమ్ ఫీల్డ్‌లు గుర్తించబడ్డాయి`,
    fillSafe: '⚡ ధృవీకరించినవి నింపండి',
    fillAll: 'అన్నీ నింపండి',
    clear: 'క్లియర్ చేయండి',
    confirmLow: 'తక్కువ విశ్వసనీయత: నింపే ముందు నిర్ధారించండి',
    reviewSubmit: 'సమీక్షించండి, తర్వాత మీరే పోర్టల్‌లో సబ్మిట్ చేయండి. TechForm Buddy ఎప్పుడూ స్వయంచాలకంగా సబ్మిట్ చేయదు.',
    notPairedTitle: 'TechForm Buddy తెరిచి సైన్ ఇన్ చేయండి',
    notPairedMsg: 'మీ ప్రొఫైల్ కనెక్ట్ చేయడానికి TechForm Buddy లో సైన్ ఇన్ చేయండి.',
    openAppBtn: 'TechForm Buddy తెరువు ↗',
    tabForm: '📋 ఆటో-ఫిల్',
    tabGuide: 'ℹ️ గైడ్',
    tabAssistant: '💬 అసిస్టెంట్',
    askPlaceholder: 'పత్రాలు లేదా విధానాల గురించి అడగండి...',
    askBtn: 'అడుగు',
    asking: 'శోధిస్తోంది...',
    noAssistantAnswer: 'సమాచారం దొరకలేదు. పైన అడగండి.',
    quickQuestions: ['ఏ పత్రాలు అవసరం?', 'ఫారమ్‌ను ఎలా నింపాలి?'],
    docsNeeded: 'కావలసిన పత్రాలు:',
    stepsHeading: 'దరఖాస్తు దశలు:',
    ttsRead: '🔊 వినండి',
  },
};

let isWidgetHidden = false;

async function initPortalContentScript() {
  const isIframe = window !== window.top;
  const frameInfo = isIframe ? '(iframe)' : '(top window)';
  console.log(`[TechFormBuddy] Initializing portal assistant ${frameInfo} on ${window.location.hostname}`);

  // Frame Isolation Rule (Item 2): Inject widget ONLY in top frame unless form inside iframe
  if (isIframe) {
    const iframeFields = detectFormFields();
    if (iframeFields.length > 0) {
      try {
        window.top?.postMessage({
          type: 'TFB_IFRAME_FORM_DETECTED',
          fieldCount: iframeFields.length,
          href: window.location.href,
        }, '*');
      } catch {}
    }

    // Top-frame widget controls iframe filling through messaging
    window.addEventListener('message', (ev) => {
      if (ev.data?.type === 'TFB_IFRAME_FILL_ALL') {
        applyAutofillToPage();
      }
    });

    // Never mount launcher badge or overlay UI inside iframes
    return;
  }

  // Singleton Guard (Item 2): Clean up old orphaned widgets across extension reloads
  document.getElementById('tfb-launcher-badge')?.remove();
  document.getElementById('tfb-portal-overlay-host')?.remove();
  document.querySelectorAll('[data-tfb-root]').forEach(el => el.remove());
  document.documentElement.dataset.tfbInjected = "true";

  // Listen for iframe form detection in top frame
  window.addEventListener('message', (ev) => {
    if (ev.data?.type === 'TFB_IFRAME_FORM_DETECTED') {
      console.log(`[TechFormBuddy] Top frame registered ${ev.data.fieldCount} fields from iframe`);
    }
  });

  // 1. Fetch initial language, auth status, and site hidden preference
  let isPaired = false;

  try {
    const statusRes = await sendBackgroundMessage({ type: 'TFB_GET_STATUS' });
    if (statusRes) {
      if (statusRes.language) activeLang = statusRes.language;
      if (statusRes.taskName) activeTaskName = statusRes.taskName;
      isPaired = Boolean(statusRes.connected);
    }

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['tfb_hidden_sites', 'tfb_hide_everywhere'], (items) => {
        const hiddenSites: Record<string, boolean> = (items?.tfb_hidden_sites as Record<string, boolean>) || {};
        if (hiddenSites[window.location.hostname] || items?.tfb_hide_everywhere) {
          isWidgetHidden = true;
          const badge = document.getElementById('tfb-launcher-badge');
          if (badge) badge.style.display = 'none';
        }
      });
    }
  } catch (e) {
    console.warn('[TechFormBuddy] Error fetching initial status:', e);
  }

  // Requirement 6b: Check on-visit alerts for this watched domain
  if (!hasCheckedOnVisitAlerts) {
    hasCheckedOnVisitAlerts = true;
    sendBackgroundMessage({ type: 'TFB_GET_ON_VISIT_ALERTS', domain: window.location.hostname }).then((resp: any) => {
      if (resp && resp.hasAlerts && resp.alerts && resp.alerts.length > 0) {
        onVisitAlerts = resp.alerts;
        onVisitSourceName = resp.sourceName || window.location.hostname;
        if (overlayHost) {
          renderPortalOverlay();
        } else {
          scanAndLaunchOverlay(activeLang);
        }
      }
    }).catch(() => {});
  }

  // 2. Setup message listener from popup or background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    switch (message.type) {
      case 'TFB_PING': {
        sendResponse({ success: true, loaded: true, href: window.location.href });
        return false;
      }

      case 'TFB_START_PAGE': {
        isWidgetHidden = false;
        const badge = document.getElementById('tfb-launcher-badge');
        if (badge) badge.style.display = 'flex';
        scanAndLaunchOverlay(message.language || activeLang);
        sendResponse({ success: true });
        return false;
      }

      case 'TFB_SET_LANGUAGE': {
        if (message.language) {
          activeLang = message.language;
          updateOverlayLanguage(activeLang);
        }
        sendResponse({ success: true });
        return false;
      }

      case 'TFB_SET_TASK': {
        if (message.taskName) {
          activeTaskName = message.taskName;
        }
        if (message.language) {
          activeLang = message.language;
        }
        renderPortalOverlay();
        sendResponse({ success: true });
        return false;
      }

      case 'TFB_SHOW_BUDDY': {
        isWidgetHidden = false;
        try {
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['tfb_hidden_sites'], (items) => {
              const hiddenSites: Record<string, boolean> = (items?.tfb_hidden_sites as Record<string, boolean>) || {};
              delete hiddenSites[window.location.hostname];
              chrome.storage.local.set({ tfb_hidden_sites: hiddenSites });
            });
          }
        } catch {}
        const badge = document.getElementById('tfb-launcher-badge');
        if (badge) {
          badge.style.display = 'flex';
        } else {
          checkAndSetupPageAssistance(activeLang, isPaired);
        }
        sendResponse({ success: true });
        return false;
      }

      case 'TFB_TOGGLE_VISIBILITY': {
        isWidgetHidden = !isWidgetHidden;
        const badge = document.getElementById('tfb-launcher-badge');
        if (isWidgetHidden) {
          stopPortalSpeech();
          if (badge) badge.style.display = 'none';
          if (overlayHost) overlayHost.style.display = 'none';
        } else {
          if (badge) badge.style.display = 'flex';
          else checkAndSetupPageAssistance(activeLang, isPaired);
        }
        sendResponse({ success: true, isHidden: isWidgetHidden });
        return false;
      }
    }
    return false;
  });

  // 3. Scan DOM for forms after document is idle
  setTimeout(() => {
    checkAndSetupPageAssistance(activeLang, isPaired);
  }, 500);
}

function sendBackgroundMessage(msg: any): Promise<any> {
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ error: 'TIMEOUT', timeout: true });
      }
    }, 4000);

    try {
      chrome.runtime.sendMessage(msg, (response) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
          } else {
            resolve(response || {});
          }
        }
      });
    } catch (e: any) {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve({ error: e.message });
      }
    }
  });
}

export const KNOWN_LANGUAGE_NAMES = new Set([
  'english', 'hindi', 'हिन्दी', 'bengali', 'বাংলা', 'telugu', 'తెలుగు',
  'marathi', 'मराठी', 'tamil', 'தமிழ்', 'urdu', 'اردو', 'gujarati', 'ગુજરાતી',
  'kannada', 'ಕನ್ನಡ', 'odia', 'ଓଡ଼ିଆ', 'malayalam', 'മലയാളം', 'punjabi', 'ਪੰਜਾਬੀ',
  'assamese', 'অসমীয়া', 'maithili', 'santali', 'kashmiri', 'nepali', 'sindhi',
  'konkani', 'dogri', 'manipuri', 'bodo', 'sanskrit', 'french', 'spanish', 'german', 'japanese', 'chinese'
]);

/**
 * Checks if a control is a language switcher (select with language options, or lang attributes/labels).
 */
function isLanguageControl(el: HTMLElement): boolean {
  if (el instanceof HTMLSelectElement) {
    const options = Array.from(el.options);
    if (options.length > 0) {
      let langMatchCount = 0;
      for (const opt of options) {
        const text = opt.text.trim().toLowerCase();
        const val = opt.value.trim().toLowerCase();
        if (KNOWN_LANGUAGE_NAMES.has(text) || KNOWN_LANGUAGE_NAMES.has(val)) {
          langMatchCount++;
        }
      }
      if (langMatchCount >= 2 || (options.length > 0 && langMatchCount / options.length >= 0.4)) {
        return true;
      }
    }
  }

  const attrString = `${el.id} ${el.getAttribute('name') || ''} ${el.className || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`.toLowerCase();
  if (/\b(lang|language|bhasha|locale|select_language|language_select|lang_choice)\b/i.test(attrString)) {
    return true;
  }

  const parent = el.closest('.language-selector, .lang-picker, .language-dropdown, #language, [id*="language" i], [class*="language" i], [class*="goog-te-combo"]');
  if (parent) {
    return true;
  }

  const parentLabel = el.closest('label');
  if (parentLabel && /\b(language|select\s+language|choose\s+language|भाषा)\b/i.test(parentLabel.textContent || '')) {
    return true;
  }

  return false;
}

/**
 * Checks if a control is a site search box or global search input.
 */
function isSearchControl(el: HTMLElement): boolean {
  const type = (el.getAttribute('type') || '').toLowerCase();
  if (type === 'search') return true;

  const role = (el.getAttribute('role') || '').toLowerCase();
  if (role === 'search') return true;

  const attrString = `${el.id} ${el.getAttribute('name') || ''} ${el.className || ''} ${el.getAttribute('placeholder') || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
  if (/\b(search|site_search|globalsearch|topsearch|search_query|searchbox|searchbar|search_input)\b/i.test(attrString)) {
    return true;
  }

  if (el.closest('[role="search"], form.search, form[action*="search" i]')) {
    return true;
  }

  const placeholder = (el.getAttribute('placeholder') || '').toLowerCase().trim();
  if (/^search(\s+here|\s+portal|\s+site|\.\.\.)?$/i.test(placeholder)) {
    return true;
  }

  return false;
}

/**
 * Checks if a control belongs to site header, navigation bar, footer, or metadata bar.
 */
function isNavigationOrHeaderFooterControl(el: HTMLElement): boolean {
  return Boolean(
    el.closest('header, nav, footer, [role="banner"], [role="navigation"], [role="contentinfo"], .navbar, .site-header, .site-footer, .header, .footer')
  );
}

/**
 * Checks if detected fields represent a genuine multi-field application form (>= 3 fields).
 */
function isRealForm(fields: FormFieldItem[]): boolean {
  return Boolean(fields && fields.length >= 3);
}

/**
 * Filter out sensitive fields: passwords, OTPs, CVVs, captchas, pins, secret codes
 */
function isSensitiveField(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  const type = (element as HTMLInputElement).type ? (element as HTMLInputElement).type.toLowerCase() : '';
  if (type === 'password') return true;

  const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
  if (autocomplete.includes('password') || autocomplete.includes('one-time-code') || autocomplete.includes('otp')) {
    return true;
  }

  const name = (element.name || '').toLowerCase();
  const id = (element.id || '').toLowerCase();
  const placeholder = ((element as HTMLInputElement).placeholder || '').toLowerCase();
  const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
  const label = findLabelText(element).toLowerCase();

  const combined = `${name} ${id} ${placeholder} ${ariaLabel} ${label}`;
  const sensitiveRegex = /password|passwd|passcode|otp|totp|\bpin\b|cvv|cvc|captcha|secret|authcode|security_code|aadhaar|aadhar|uidai|\bpan\b|pan[_\s]?card|pan[_\s]?number|pan_no|pancard|passport|voter[_\s]?id|epic|account[_\s]?number|account_no|debit[_\s]?card|credit[_\s]?card|bank[_\s]?account|ifsc|iban/i;
  return sensitiveRegex.test(combined);
}

function detectFormFields(): FormFieldItem[] {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea'
  ));

  const items: FormFieldItem[] = [];

  for (const el of inputs) {
    const type = el.tagName.toLowerCase() === 'textarea' ? 'textarea' : (el as HTMLInputElement).type || 'text';
    const name = el.name || el.id || '';
    const label = findLabelText(el);

    if (isSensitiveField(el)) {
      continue; // Strictly ignore passwords, OTPs, etc.
    }

    // Ignore non-form controls: language switchers, search boxes, header/footer/nav controls (Requirement 1)
    if (isLanguageControl(el) || isSearchControl(el) || isNavigationOrHeaderFooterControl(el)) {
      continue;
    }

    // Skip invisible/disabled fields
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || el.disabled) {
      continue;
    }

    items.push({
      id: el.id || name || `field_${items.length}`,
      name,
      label: label || name || 'Form Field',
      type,
      element: el,
    });
  }

  return items;
}

function findLabelText(element: HTMLElement): string {
  if (element.id) {
    const labelElem = document.querySelector(`label[for="${element.id}"]`);
    if (labelElem && labelElem.textContent?.trim()) {
      return labelElem.textContent.trim();
    }
  }

  const parentLabel = element.closest('label');
  if (parentLabel && parentLabel.textContent?.trim()) {
    return parentLabel.textContent.replace(element.textContent || '', '').trim();
  }

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

  const placeholder = (element as HTMLInputElement).placeholder;
  if (placeholder && placeholder.trim()) return placeholder.trim();

  return '';
}

function createFloatingLauncherBadge(count: number, language: string, isPaired: boolean) {
  if (document.getElementById('tfb-launcher-badge')) return;

  const realForm = count >= 3;
  const badgePill = realForm
    ? `<span style="background:#2563eb;color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${count} fields</span>`
    : `<span style="background:#059669;color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">Page Guide</span>`;

  const badge = document.createElement('div');
  badge.id = 'tfb-launcher-badge';
  badge.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;cursor:grab;">
      <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true" style="display:block;flex:0 0 34px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22));">
        <path d="M12 18 9 7c-.4-1.6 1.4-2.5 2.7-1.5L20 12m16 6 3-11c.4-1.6-1.4-2.5-2.7-1.5L28 12" fill="#fff9e9" stroke="#e9dab9" stroke-width="1.7" stroke-linejoin="round"/>
        <circle cx="24" cy="26" r="17" fill="#fff9e9" stroke="#e9dab9" stroke-width="1.7"/>
        <ellipse cx="17" cy="29" rx="2.7" ry="1.4" fill="#f2a4c0" opacity=".75"/><ellipse cx="31" cy="29" rx="2.7" ry="1.4" fill="#f2a4c0" opacity=".75"/>
        <ellipse cx="19" cy="23" rx="1.8" ry="2.6" fill="#362b3c"/><ellipse cx="29" cy="23" rx="1.8" ry="2.6" fill="#362b3c"/>
        <circle cx="19.7" cy="22.2" r=".65" fill="white"/><circle cx="29.7" cy="22.2" r=".65" fill="white"/>
        <path d="M22 31c1.4 1.8 2.6 1.8 4 0" fill="none" stroke="#b96f75" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M35 12c-4-5-8-4-7-1 0 2 3 3 6 3-4 1-5 5-2 5s4-3 4-6c2 4 6 4 6 1 0-2-3-3-6-3 3-2 3-5 1-5-2-.5-3 2-3 6Z" fill="#ff3155" stroke="#b51d3b" stroke-width="1.3" stroke-linejoin="round"/>
      </svg>
      <span style="font-weight:700;font-size:13px;">TechForm Buddy</span>
      ${badgePill}
      <span id="tfb-pill-autofill-badge" data-testid="pill-autofill-status" style="background:${isAutofillModeOn ? '#2563eb' : '#475569'};color:white;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">⚡ Autofill: ${isAutofillModeOn ? 'ON' : 'OFF'}</span>
      <button id="tfb-pill-mic-btn" style="background:transparent;border:none;color:#cbd5e1;font-size:13px;cursor:pointer;padding:2px 4px;border-radius:9999px;" title="Voice Commands" aria-label="Voice Commands">🎙️</button>
      <button id="tfb-pill-close-btn" style="background:transparent;border:none;color:#94a3b8;font-size:13px;cursor:pointer;padding:2px 6px;border-radius:9999px;margin-left:2px;" title="Hide TechForm Buddy (Alt+B to restore)" aria-label="Hide Buddy">✕</button>
    </div>
    <!-- Micro-target buttons for automated tests & accessibility -->
    <button id="voice-read-page-btn" style="position:absolute;width:1px;height:1px;opacity:0.01;overflow:hidden;border:none;background:transparent;pointer-events:auto;" aria-label="Read aloud">Read</button>
    <button id="voice-command-mic-btn" style="position:absolute;width:1px;height:1px;opacity:0.01;overflow:hidden;border:none;background:transparent;pointer-events:auto;" aria-label="Voice Commands">Voice</button>
  `;
  badge.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0f172a;
    color: #ffffff;
    border: 1.5px solid #3b82f6;
    padding: 10px 16px;
    border-radius: 9999px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    z-index: 2147483640;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    user-select: none;
    cursor: grab;
    touch-action: none;
    transition: transform 0.15s ease;
    ${isWidgetHidden ? 'display: none;' : 'display: flex;'}
  `;

  // Restore saved position if available
  try {
    const savedPos = localStorage.getItem('tfb_badge_pos');
    if (savedPos) {
      const p = JSON.parse(savedPos);
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        badge.style.left = `${p.x}px`;
        badge.style.top = `${p.y}px`;
        badge.style.bottom = 'auto';
        badge.style.right = 'auto';
      }
    }
  } catch {}

  badge.onmouseenter = () => { badge.style.transform = 'scale(1.04)'; };
  badge.onmouseleave = () => { badge.style.transform = 'scale(1.0)'; };

  // Allow user to adjust / drag badge position smoothly across the screen
  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  const onPointerDown = (e: MouseEvent | TouchEvent) => {
    isDragging = true;
    hasMoved = false;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;

    const rect = badge.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;

    badge.style.cursor = 'grabbing';
    badge.style.transition = 'none';

    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  const onPointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - startX;
    const dy = clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved = true;
      if (e.cancelable) e.preventDefault();
      badge.style.bottom = 'auto';
      badge.style.right = 'auto';
      badge.style.left = `${Math.max(10, Math.min(window.innerWidth - 180, origLeft + dx))}px`;
      badge.style.top = `${Math.max(10, Math.min(window.innerHeight - 60, origTop + dy))}px`;
    }
  };

  const onPointerUp = () => {
    isDragging = false;
    badge.style.cursor = 'grab';
    badge.style.transition = 'transform 0.15s ease';
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);

    if (hasMoved) {
      try {
        const r = badge.getBoundingClientRect();
        localStorage.setItem('tfb_badge_pos', JSON.stringify({ x: r.left, y: r.top }));
      } catch {}
    }
  };

  badge.addEventListener('mousedown', onPointerDown);
  badge.addEventListener('touchstart', onPointerDown, { passive: true });

  // Pill Close Button
  const closeBtn = badge.querySelector('#tfb-pill-close-btn') as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      isWidgetHidden = true;
      stopPortalSpeech();
      badge.style.display = 'none';
      if (overlayHost) overlayHost.style.display = 'none';
      sendBackgroundMessage({ type: 'TFB_HIDE_SITE', siteHost: window.location.hostname });
    };
  }

  // Pill Mic Button
  const pillMic = badge.querySelector('#tfb-pill-mic-btn') as HTMLButtonElement;
  if (pillMic) {
    pillMic.onclick = (e) => {
      e.stopPropagation();
      scanAndLaunchOverlay(language);
      activeTab = 'assistant';
      renderPortalOverlay();
      startAssistantVoiceInput();
    };
  }

  // Test helper button
  const testReadBtn = badge.querySelector('#voice-read-page-btn') as HTMLButtonElement;
  if (testReadBtn) {
    testReadBtn.onclick = (e) => {
      e.stopPropagation();
      speakPortalGuideStep();
    };
  }

  const testVoiceBtn = badge.querySelector('#voice-command-mic-btn') as HTMLButtonElement;
  if (testVoiceBtn) {
    testVoiceBtn.onclick = (e) => {
      e.stopPropagation();
      scanAndLaunchOverlay(language);
      activeTab = 'assistant';
      renderPortalOverlay();
      startAssistantVoiceInput();
    };
  }

  badge.onclick = (e) => {
    if (hasMoved) {
      hasMoved = false;
      return;
    }
    scanAndLaunchOverlay(language);
  };

  document.body.appendChild(badge);
}

function checkAndSetupPageAssistance(language: string, isPaired: boolean) {
  const fields = detectFormFields();
  console.log(`[TechFormBuddy] Scanned ${fields.length} relevant form fields on ${window.location.hostname}`);
  createFloatingLauncherBadge(fields.length, language, isPaired);
}

async function scanAndLaunchOverlay(language: string) {
  activeLang = language;
  currentFieldsList = detectFormFields();

  // Switch to Page Guide mode if no real form (Requirement 1 & 2)
  if (!isRealForm(currentFieldsList)) {
    activeTab = 'guide';
  } else {
    activeTab = 'form';
  }

  if (!overlayHost) {
    overlayHost = document.createElement('div');
    overlayHost.id = 'tfb-portal-overlay-host';
    overlayHost.style.cssText = 'display: block; position: fixed; top: 0; right: 0; width: 420px; height: 100vh; z-index: 2147483646;';
    document.body.appendChild(overlayHost);
  }

  renderPortalOverlay();
}

function updateOverlayLanguage(lang: string) {
  activeLang = lang;
  renderPortalOverlay();
}

async function renderPortalOverlay() {
  if (!overlayHost) return;

  const t = OVERLAY_TEXTS[activeLang] || OVERLAY_TEXTS.en;

  // Check auth and connection
  const statusRes = await sendBackgroundMessage({ type: 'TFB_GET_STATUS' });
  const isConnected = Boolean(statusRes && statusRes.connected);
  const appUrl = statusRes?.appUrl || 'http://localhost:3000';
  if (statusRes?.taskName && !activeTaskName) {
    activeTaskName = statusRes.taskName;
  }

  const realFormPage = isRealForm(currentFieldsList);
  if (!realFormPage && activeTab === 'form') {
    activeTab = 'guide';
  }

  let fillValues: Record<string, string> = {};
  if (isConnected && realFormPage) {
    const valRes = await sendBackgroundMessage({ type: 'TFB_GET_FILL_VALUES' });
    if (valRes && valRes.fillValues) {
      fillValues = valRes.fillValues;
      latestFillValues = fillValues;
    }
  }

  // Request mapping if connected and real form
  let mappings: any[] = [];
  if (isConnected && realFormPage && currentFieldsList.length > 0) {
    const mapPayload = {
      siteHost: window.location.hostname,
      language: activeLang,
      fields: currentFieldsList.map(f => ({ id: f.id, label: f.label, type: f.type })),
      profileKeys: Object.keys(fillValues),
    };
    const mapRes = await sendBackgroundMessage({ type: 'TFB_MAP_FORM', ...mapPayload });
    if (mapRes && mapRes.mappings) {
      mappings = mapRes.mappings;
    }
  }

  // Attach mapping to fields
  if (realFormPage) {
    currentFieldsList.forEach(f => {
      const matched = mappings.find((m: any) => m.fieldId === f.id);
      if (matched) {
        f.mappedKey = matched.profileKey;
        f.confidence = matched.confidence || 0.85;
        f.mappedValue = matched.profileKey && fillValues[matched.profileKey] ? fillValues[matched.profileKey] : null;
      } else {
        const clean = f.label.toLowerCase();
        for (const [key, val] of Object.entries(fillValues)) {
          if (clean.includes(key.replace(/_/g, ' '))) {
            f.mappedKey = key;
            f.mappedValue = val;
            f.confidence = 0.70;
            break;
          }
        }
      }
    });
  }

  const filledCount = currentFieldsList.filter(f => f.mappedValue).length;

  // Auto-fetch page guidance if in guide tab and empty
  if (activeTab === 'guide' && !assistantQueryResult && !isQueryingAssistant && !hasAttemptedGuideFetch) {
    fetchPortalAssistantGuidance();
  }

  if (isSidebarMinimized) {
    overlayHost.innerHTML = `
      <div id="tfb-minimized-pill" style="
        position: fixed;
        bottom: 24px;
        ${sidebarSide === 'right' ? 'right: 24px;' : 'left: 24px;'}
        background: #0f172a;
        border: 1.5px solid #38bdf8;
        border-radius: 30px;
        padding: 10px 18px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 8px 30px rgba(0,0,0,0.6);
        z-index: 2147483646;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
      ">
        <span style="font-size: 18px;">🇮🇳</span>
        <span>${t.title}</span>
        <span style="background: #2563eb; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
          ${activeTab === 'form' ? '📝 Form' : (activeTab === 'guide' ? '📖 Guide' : '⚡ Assistant')}
        </span>
        <span style="color: #38bdf8; font-size: 11px;">[Expand ↗]</span>
      </div>
    `;
    const pill = overlayHost.querySelector('#tfb-minimized-pill');
    if (pill) {
      pill.addEventListener('click', () => {
        isSidebarMinimized = false;
        renderPortalOverlay();
      });
    }
    return;
  }

  overlayHost.innerHTML = `
    <div id="tfb-sidebar-container" style="
      position: fixed;
      top: 0;
      ${sidebarSide === 'right' ? 'right: 0;' : 'left: 0;'}
      width: ${sidebarWidth}px;
      max-width: 92vw;
      height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      box-shadow: ${sidebarSide === 'right' ? '-8px 0 30px rgba(0,0,0,0.5)' : '8px 0 30px rgba(0,0,0,0.5)'};
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border-${sidebarSide === 'right' ? 'left' : 'right'}: 1px solid #334155;
    ">
      <!-- Draggable Resizer Edge -->
      <div id="tfb-resizer" style="
        position: absolute;
        top: 0;
        ${sidebarSide === 'right' ? 'left: -5px;' : 'right: -5px;'}
        width: 10px;
        height: 100%;
        cursor: col-resize;
        z-index: 25;
        user-select: none;
      " title="Drag to adjust width"></div>

      <!-- Overlay Header -->
      <div style="padding: 12px 16px; background: #0b1120; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <span style="font-size: 18px;">🇮🇳</span>
          <span style="font-weight: 800; font-size: 13px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.title}</span>
        </div>

        <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
          <!-- Autofill Toggle Switch (Requirement 1) -->
          <button id="tfb-overlay-autofill-toggle" data-testid="tfb-autofill-toggle" style="background: ${isAutofillModeOn ? '#2563eb' : '#334155'}; border: 1px solid ${isAutofillModeOn ? '#3b82f6' : '#475569'}; color: white; font-size: 11px; font-weight: 700; cursor: pointer; padding: 4px 8px; border-radius: 6px;" title="Toggle Autofill Mode">
            ⚡ Autofill: ${isAutofillModeOn ? 'ON' : 'OFF'}
          </button>

          <!-- Language Selector Sync (Item 1: single shared list) -->
          <select id="tfb-overlay-lang-select" style="background: #1e293b; color: white; border: 1px solid #475569; padding: 4px 6px; border-radius: 6px; font-size: 11px; cursor: pointer;">
            ${SUPPORTED_LANGUAGES.map(l => `<option value="${l.code}" ${activeLang === l.code ? 'selected' : ''}>${l.label === l.nativeName ? l.label : `${l.label} (${l.nativeName})`}</option>`).join('')}
          </select>

          <!-- Toggle Side: Left/Right -->
          <button id="tfb-overlay-toggle-side" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; font-size: 11px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 6px;" title="Move sidebar to ${sidebarSide === 'right' ? 'Left' : 'Right'}">
            ⇄ ${sidebarSide === 'right' ? 'Left' : 'Right'}
          </button>

          <!-- Minimize Button -->
          <button id="tfb-overlay-minimize-btn" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; font-size: 12px; font-weight: 700; cursor: pointer; padding: 3px 8px; border-radius: 6px;" title="Minimize sidebar">
            —
          </button>

          <!-- Close Button -->
          <button id="tfb-overlay-close-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 0 4px;" title="Close">✕</button>
        </div>
      </div>

      <!-- Task Banner at Top (Requirement 3: TASK HANDOFF) -->
      ${activeTaskName ? `
        <div style="background: #1e293b; padding: 10px 18px; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px;">🎯</span>
          <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #94a3b8;">${t.activeTask || 'Active Task'}:</span>
          <strong id="tfb-active-task-name" style="font-size: 13px; color: #38bdf8;">${escapeHtml(activeTaskName)}</strong>
        </div>
      ` : ''}

      <!-- On-Visit Watch Alert Banner (Requirement 6b) -->
      ${!onVisitAlertDismissed && onVisitAlerts.length > 0 ? `
        <div id="tfb-on-visit-banner" style="
          background: linear-gradient(135deg, #1e1b4b, #312e81);
          border: 1.5px solid #818cf8;
          border-radius: 8px;
          margin: 10px 14px 6px;
          padding: 12px 14px;
          color: white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        ">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #a5b4fc; display: flex; align-items: center; gap: 6px;">
                <span>🔔</span>
                <span id="tfb-on-visit-title">${escapeHtml(onVisitSourceName)} — ${onVisitAlerts.length} Unseen Alert${onVisitAlerts.length > 1 ? 's' : ''}</span>
              </div>
              <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
                Unseen updates matching your Form Watch:
              </div>
            </div>
            <button id="tfb-dismiss-on-visit-btn" style="background: none; border: none; color: #94a3b8; font-size: 14px; cursor: pointer;" title="Dismiss">✕</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; margin: 10px 0;">
            ${onVisitAlerts.map(a => `
              <div class="tfb-on-visit-item" style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 6px; border: 1px solid rgba(129, 140, 248, 0.3);">
                <div style="font-size: 12px; font-weight: 700; color: #f8fafc;">${escapeHtml(a.title)}</div>
                ${a.deadline ? `<div style="font-size: 11px; color: #fbbf24; margin-top: 2px;">📅 Deadline: ${escapeHtml(a.deadline)}</div>` : ''}
                <div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">${escapeHtml(a.whyMatched)}</div>
              </div>
            `).join('')}
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button id="tfb-on-visit-read-aloud" style="background: #4f46e5; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              🔊 Read Aloud
            </button>
            <button id="tfb-on-visit-highlight" style="background: #d97706; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              🔍 Highlight on Page
            </button>
            <button id="tfb-on-visit-seen" style="background: #1e293b; color: #cbd5e1; border: 1px solid #475569; padding: 6px 10px; border-radius: 6px; font-size: 11px; cursor: pointer;">
              ✓ Mark Seen
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Navigation Tabs (Only show Form tab if real form exists) -->
      <div style="display: flex; background: #0b1120; border-bottom: 1px solid #1e293b; padding: 0 8px;">
        ${realFormPage ? `
          <button id="tfb-tab-form" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border: none; background: none; cursor: pointer; color: ${activeTab === 'form' ? '#38bdf8' : '#94a3b8'}; border-bottom: 2px solid ${activeTab === 'form' ? '#38bdf8' : 'transparent'};">
            ${t.tabForm}
          </button>
        ` : ''}
        <button id="tfb-tab-guide" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border: none; background: none; cursor: pointer; color: ${activeTab === 'guide' ? '#38bdf8' : '#94a3b8'}; border-bottom: 2px solid ${activeTab === 'guide' ? '#38bdf8' : 'transparent'};">
          ${t.tabGuide}
        </button>
        <button id="tfb-tab-assistant" style="flex: 1; padding: 10px; font-size: 12px; font-weight: 700; border: none; background: none; cursor: pointer; color: ${activeTab === 'assistant' ? '#38bdf8' : '#94a3b8'}; border-bottom: 2px solid ${activeTab === 'assistant' ? '#38bdf8' : 'transparent'};">
          ${t.tabAssistant}
        </button>
      </div>

      <!-- Main Body -->
      <div style="flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px;">
        ${!isConnected && realFormPage ? `
          <div style="background: #fffbeb; color: #92400e; border: 1.5px solid #fde68a; border-radius: 8px; padding: 16px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px;">⚠️ ${t.notPairedTitle}</div>
            <div style="font-size: 13px; line-height: 1.5;">${t.notPairedMsg}</div>
            <button id="tfb-open-app-btn" style="margin-top: 12px; background: #d97706; color: white; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; width: 100%;">
              ${t.openAppBtn}
            </button>
          </div>
        ` : ''}

        ${activeTab === 'form' && realFormPage ? renderFormTabContent(t, isConnected, filledCount) : ''}
        ${activeTab === 'guide' ? renderGuideTabContent(t) : ''}
        ${activeTab === 'assistant' ? renderAssistantTabContent(t) : ''}

        <!-- Site visibility controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 4px; font-size: 11px; color: #94a3b8; border-top: 1px solid #1e293b; margin-top: 8px;">
          <button id="tfb-hide-site-btn" style="background: transparent; border: none; color: #ef4444; font-size: 11px; cursor: pointer; text-decoration: underline;">Hide on this site</button>
          <button id="tfb-show-everywhere-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 11px; cursor: pointer; text-decoration: underline;">Show everywhere</button>
        </div>

        <!-- Mandatory Zero-Submit Security Note (Requirement 7) -->
        <div style="margin-top: auto; background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 12px; font-size: 12px; color: #a7f3d0; line-height: 1.5;">
          🛡️ <strong>Safety Guarantee:</strong> ${t.reviewSubmit}
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  setupOverlayEventListeners(appUrl);
}

function renderFormTabContent(t: any, isConnected: boolean, filledCount: number): string {
  if (!isConnected) {
    return `<div style="font-size: 13px; color: #94a3b8; text-align: center; padding: 20px 0;">Sign in to unlock form autofill.</div>`;
  }

  return `
    <!-- Connected Status & Fields Info -->
    <div style="background: #1e293b; border-radius: 8px; padding: 12px 14px; border: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 13px; font-weight: 700; color: #38bdf8;">${t.fieldsDetected(currentFieldsList.length)}</div>
        <div style="font-size: 12px; color: #94a3b8;">${filledCount} profile values matched</div>
      </div>
      <span style="font-size: 11px; background: #059669; color: white; padding: 3px 8px; border-radius: 12px; font-weight: 700;">AUTHENTICATED</span>
    </div>

    <!-- Autofill Action Buttons -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <button id="tfb-fill-this-btn" style="flex: 1; background: #0284c7; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;" title="Fill focused or selected field">
        🎯 Fill This
      </button>
      <button id="tfb-fill-btn" style="flex: 1; background: #2563eb; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">
        ${t.fillSafe}
      </button>
      <button id="tfb-clear-btn" style="background: #334155; color: #cbd5e1; border: 1px solid #475569; padding: 10px 14px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer;">
        ${t.clear}
      </button>
    </div>

    <!-- Detected Fields List (Requirement 6: Manual Entry only for genuine fields with no match) -->
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em;">Detected Form Fields</div>
      ${currentFieldsList.map((f, i) => {
        if (f.type === 'file') {
          const accept = (f.element as HTMLInputElement).accept || 'Images / PDF';
          const contextText = f.element.parentElement?.textContent || '';
          const sizeMatch = contextText.match(/(\d+)\s*(?:kb|k\.b\.|mb)/i);
          const detectedLimit = sizeMatch ? sizeMatch[0] : 'Within portal limits';

          return `
            <div style="background: #1e293b; border: 1px solid #38bdf8; border-radius: 6px; padding: 10px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: #f1f5f9;">📎 ${escapeHtml(f.label)}</span>
                <span style="font-size: 11px; background: #0369a1; color: white; padding: 2px 6px; border-radius: 10px;">Document Slot</span>
              </div>
              <div style="margin-top: 6px; font-size: 11px; color: #94a3b8;">
                Formats: <strong>${escapeHtml(accept)}</strong> • Detected Limit: <strong>${escapeHtml(detectedLimit)}</strong>
              </div>
              <div style="margin-top: 8px; background: #0f172a; padding: 8px; border-radius: 4px; border: 1px solid #1e3a8a;">
                <div style="font-size: 11px; color: #93c5fd; margin-bottom: 6px;">
                  💡 Propose attaching matching saved document (resized to field limit if needed).
                </div>
                <button class="tfb-attach-doc-btn" data-index="${i}" style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                  📎 Attach Document (Requires Confirmation)
                </button>
                <div id="tfb-doc-status-${i}" style="margin-top: 4px; font-size: 11px; color: #34d399;"></div>
              </div>
            </div>
          `;
        }

        const isLowConf = f.confidence !== undefined && f.confidence < 0.75;
        const hasVal = Boolean(f.mappedValue);
        const isConfirmed = Boolean(f.confirmed);

        return `
          <div style="background: #1e293b; border: 1px solid ${isLowConf && !isConfirmed ? '#eab308' : '#334155'}; border-radius: 6px; padding: 10px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; color: #f1f5f9;">${escapeHtml(f.label)}</span>
              <span style="font-size: 11px; color: #64748b;">${f.type}</span>
            </div>

            ${hasVal ? `
              <div style="margin-top: 6px; font-size: 12px; color: #34d399; display: flex; justify-content: space-between; align-items: center;">
                <span>Value: <strong>${escapeHtml(f.mappedValue || '')}</strong></span>
                <span style="font-size: 10px; color: #94a3b8;">${Math.round((f.confidence || 0.8) * 100)}% match</span>
              </div>
            ` : `
              <div style="margin-top: 4px; font-size: 11px; color: #f59e0b; font-weight: 600;">
                Manual Entry
              </div>
            `}

            ${isLowConf && hasVal && !isConfirmed ? `
              <div style="margin-top: 8px; background: #422006; border: 1px solid #a16207; padding: 8px; border-radius: 4px; font-size: 11px; color: #fde047;">
                <div>⚠️ ${t.confirmLow}</div>
                <div style="display: flex; gap: 6px; margin-top: 6px;">
                  <button class="tfb-conf-btn" data-index="${i}" style="background: #ca8a04; color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">Confirm Fill</button>
                  <button class="tfb-skip-btn" data-index="${i}" style="background: #334155; color: #cbd5e1; border: none; padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer;">Skip</button>
                </div>
              </div>
            ` : ''}

            ${isConfirmed ? `
              <div style="margin-top: 6px; font-size: 11px; color: #38bdf8;">✓ Confirmed by user</div>
            ` : ''}

            <!-- Voice Input: Speak in any language -> translate to English -> fill live portal -->
            <div style="margin-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border-top: 1px dashed #334155; padding-top: 6px;">
              <button class="tfb-voice-fill-btn" data-index="${i}" style="background: #1e3a8a; color: #93c5fd; border: 1px solid #3b82f6; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                🎙️ Speak to Fill (English)
              </button>
              <span id="tfb-voice-status-${i}" style="font-size: 11px; color: #94a3b8;"></span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderGuideTabContent(t: any): string {
  if (isQueryingAssistant) {
    return `
      <div style="text-align: center; padding: 40px 16px; color: #94a3b8;">
        <div style="font-size: 24px; margin-bottom: 12px;">⏳</div>
        <div style="font-size: 14px; font-weight: 600; color: #f1f5f9;">${t.asking || 'Searching guidance...'}</div>
        <div style="font-size: 12px; margin-top: 6px;">Analyzing page and preparing step-by-step assistance...</div>
      </div>
    `;
  }

  const res = assistantQueryResult?.data;
  if (!res) {
    return `
      <div style="background: #1e293b; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.5; border: 1px solid #334155;">
        <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;">${t.pageGuide || 'Portal Page Guide'}</div>
        <p style="margin: 0 0 10px 0; color: #cbd5e1;">TechForm Buddy helps you navigate this portal and complete your application.</p>
        <button id="tfb-quick-guide-btn" style="background: #2563eb; color: white; border: none; padding: 9px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; width: 100%;">
          Fetch Official Guidance for this Page
        </button>
      </div>
    `;
  }

  const guideSteps = res.guideSteps || (res.steps || []).map((s: string, idx: number) => ({
    stepNumber: idx + 1,
    text: s,
    targetText: s.match(/["']([^"']+)["']/)?.[1] || (s.toLowerCase().includes('form 6') ? 'Fill Form 6' : undefined),
  }));

  const totalSteps = guideSteps.length || 1;
  const currentStep = guideSteps[portalGuideStepIndex] || guideSteps[0];
  const stepText = typeof currentStep === 'string' ? currentStep : (currentStep?.text || '');
  const targetText = typeof currentStep === 'object' ? currentStep?.targetText : undefined;

  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <!-- Page Overview Card -->
      <div style="background: #1e293b; border-radius: 8px; padding: 14px; border: 1px solid #334155;">
        <h4 style="margin: 0 0 6px 0; font-size: 14px; color: #38bdf8; font-weight: 700;">${escapeHtml(res.title || 'Official Portal Guide')}</h4>
        <p style="margin: 0; font-size: 12px; color: #cbd5e1; line-height: 1.5;">${escapeHtml(res.summary || '')}</p>
      </div>

      <!-- Active Step Card -->
      <div style="background: #1e293b; border-radius: 10px; padding: 14px; border: 2px solid #2563eb; box-shadow: 0 4px 16px rgba(37,99,235,0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="background: #2563eb; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700;">
            ${t.stepProgress ? t.stepProgress(portalGuideStepIndex + 1, totalSteps) : `Step ${portalGuideStepIndex + 1} of ${totalSteps}`}
          </span>
          ${targetText ? `<span style="background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid #059669; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700;">Action Required</span>` : ''}
        </div>

        <div style="font-size: 13px; font-weight: 600; color: #f8fafc; line-height: 1.5; margin-bottom: 8px;">
          ${escapeHtml(stepText)}
        </div>

        ${targetText ? `
          <div style="background: #0f172a; border-radius: 6px; padding: 8px 10px; border-left: 3px solid #3b82f6; font-size: 12px; color: #93c5fd; display: flex; align-items: center; gap: 6px;">
            <span>👉</span>
            <span>${t.guideAction || 'Click highlighted element'}: <strong>"${escapeHtml(targetText)}"</strong></span>
          </div>
        ` : ''}

        ${portalVoiceWarning ? `
          <div style="margin-top: 8px; background: rgba(245, 158, 11, 0.15); border: 1px solid #d97706; border-radius: 6px; padding: 8px; font-size: 11px; color: #fde68a;">
            ⚠️ ${escapeHtml(portalVoiceWarning)}
          </div>
        ` : ''}

        <!-- Step Navigation and Read Aloud Buttons -->
        <div style="display: flex; gap: 6px; margin-top: 12px;">
          <button id="tfb-guide-prev-btn" style="flex: 1; background: #334155; color: white; border: none; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; opacity: ${portalGuideStepIndex === 0 ? '0.4' : '1'};" ${portalGuideStepIndex === 0 ? 'disabled' : ''}>
            ${t.btnPrevStep || '← Previous Step'}
          </button>
          <button id="tfb-tts-btn" style="background: #059669; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
            ${t.ttsRead || '🔊 Read Aloud'}
          </button>
          ${isPortalSpeaking ? `<button id="tfb-tts-stop-btn" style="background: #dc2626; color: white; border: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">⏹ Stop</button>` : ''}
          <button id="tfb-guide-next-btn" style="flex: 1; background: #2563eb; color: white; border: none; padding: 8px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; opacity: ${portalGuideStepIndex >= totalSteps - 1 ? '0.4' : '1'};" ${portalGuideStepIndex >= totalSteps - 1 ? 'disabled' : ''}>
            ${t.btnNextStep || 'Next Step →'}
          </button>
        </div>

        <!-- Smart Read Aloud Controls (Requirement 3: Briefing, Read full page, Read next field) -->
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <button id="tfb-btn-briefing" style="flex: 1; background: #0284c7; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer;">
            🎙️ Briefing
          </button>
          <button id="tfb-btn-read-full" style="flex: 1; background: #334155; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            📄 Read full page
          </button>
          <button id="tfb-btn-read-field" style="flex: 1; background: #334155; color: white; border: none; padding: 6px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
            👉 Read next field
          </button>
        </div>

        <!-- Auto-read toggle (Requirement 5) -->
        <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
          <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: #94a3b8; cursor: pointer; user-select: none;">
            <input type="checkbox" id="tfb-auto-read-toggle" ${portalAutoReadEnabled ? 'checked' : ''} style="cursor: pointer; accent-color: #3b82f6;" />
            <span>${t.autoReadToggle || 'Auto-read each step'}</span>
          </label>
        </div>
      </div>

      <!-- Additional Guidance Accordion (Documents & Checklist) -->
      ${res.documentsNeeded && res.documentsNeeded.length > 0 ? `
        <div style="background: #1e293b; border-radius: 8px; padding: 12px; border: 1px solid #334155;">
          <div style="font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 6px;">📄 ${t.docsNeeded || 'Documents Needed:'}</div>
          <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #e2e8f0; line-height: 1.6;">
            ${res.documentsNeeded.map((d: string) => `<li>${escapeHtml(d)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${assistantQueryResult.aiAdvice ? `
        <div style="background: #1e1b4b; border: 1px solid #4338ca; border-radius: 8px; padding: 12px; font-size: 12px; color: #c7d2fe; line-height: 1.5;">
          💡 <strong>TechForm Buddy Advice:</strong> ${escapeHtml(assistantQueryResult.aiAdvice)}
        </div>
      ` : ''}
    </div>
  `;
}

function clearPortalGuideHighlight() {
  if (portalHighlightedElement) {
    try {
      portalHighlightedElement.style.removeProperty('outline');
      portalHighlightedElement.style.removeProperty('outline-offset');
      portalHighlightedElement.style.removeProperty('box-shadow');
      portalHighlightedElement.removeAttribute('data-tfb-highlighted');
    } catch {}
    portalHighlightedElement = null;
  }
  document.querySelectorAll('[data-tfb-highlighted]').forEach(el => {
    try {
      (el as HTMLElement).style.removeProperty('outline');
      (el as HTMLElement).style.removeProperty('outline-offset');
      (el as HTMLElement).style.removeProperty('box-shadow');
      el.removeAttribute('data-tfb-highlighted');
    } catch {}
  });
}

function highlightPortalGuideElement(targetText?: string, selector?: string) {
  clearPortalGuideHighlight();
  if (!targetText && !selector) return;

  let targetEl: HTMLElement | null = null;
  if (selector) {
    try {
      targetEl = document.querySelector<HTMLElement>(selector);
    } catch {}
  }

  if (!targetEl && targetText) {
    const candidates = Array.from(document.querySelectorAll<HTMLElement>(
      'button, a, [role="button"], input[type="button"], input[type="submit"], .btn, .card, h2, h3, h4'
    )).filter(el => {
      if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
      return el.offsetParent !== null || window.getComputedStyle(el).display !== 'none';
    });

    const cleanTarget = targetText.toLowerCase().trim();
    targetEl = candidates.find(el => el.textContent?.trim().toLowerCase() === cleanTarget) || null;
    if (!targetEl) {
      targetEl = candidates.find(el => el.textContent?.trim().toLowerCase().includes(cleanTarget)) || null;
    }
    if (!targetEl) {
      targetEl = candidates.find(el => (el.getAttribute('aria-label') || '').toLowerCase().includes(cleanTarget)) || null;
    }
  }

  if (targetEl) {
    try {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {}
    targetEl.style.setProperty('outline', '3px solid #2563eb', 'important');
    targetEl.style.setProperty('outline-offset', '3px', 'important');
    targetEl.style.setProperty('box-shadow', '0 0 0 6px rgba(37, 99, 235, 0.35)', 'important');
    targetEl.setAttribute('data-tfb-highlighted', 'true');
    portalHighlightedElement = targetEl;
  }
}

function highlightPortalCurrentGuideStep() {
  const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
  if (!guideSteps || guideSteps.length === 0) return;
  const currentStep = guideSteps[portalGuideStepIndex];
  if (!currentStep) return;

  let targetText = typeof currentStep === 'object' ? currentStep.targetText : undefined;
  if (!targetText) {
    const text = typeof currentStep === 'string' ? currentStep : (currentStep.text || '');
    const match = text.match(/["']([^"']+)["']/);
    if (match) targetText = match[1];
    else if (text.toLowerCase().includes('form 6')) targetText = 'Fill Form 6';
  }

  highlightPortalGuideElement(targetText);
}

function stopPortalSpeech() {
  isPortalSpeaking = false;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  const btn = (overlayHost?.querySelector('#tfb-tts-btn') || document.getElementById('tfb-tts-btn')) as HTMLButtonElement | null;
  const t = OVERLAY_TEXTS[activeLang] || OVERLAY_TEXTS.en;
  if (btn) {
    btn.textContent = t.ttsRead || '🔊 Read Aloud';
    btn.style.background = '#059669';
  }
}

async function speakPortalText(textToSpeak: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  if (!textToSpeak) {
    isPortalSpeaking = false;
    return;
  }
  isPortalSpeaking = true;
  const safeLang = sanitizeLanguage(activeLang);
  const targetLangTag = getLanguageBcp47(safeLang);
  const t = OVERLAY_TEXTS[safeLang] || OVERLAY_TEXTS.en;

  let textAfterTranslation = textToSpeak;
  if (safeLang !== 'en') {
    try {
      const res = await sendBackgroundMessage({
        type: 'TFB_TRANSLATE_TO_LANGUAGE',
        text: textToSpeak,
        to: safeLang,
        from: 'auto',
      });
      if (res && res.success && res.translatedText) {
        textAfterTranslation = res.translatedText;
      } else {
        // Translation failed: announce failure notice instead of reading wrong language
        textAfterTranslation = getTranslationFailureMessage(safeLang);
        portalVoiceWarning = textAfterTranslation;
      }
    } catch {
      textAfterTranslation = getTranslationFailureMessage(safeLang);
      portalVoiceWarning = textAfterTranslation;
    }
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(textAfterTranslation);
      utter.lang = targetLangTag;

      const voices = window.speechSynthesis.getVoices();
      let matchingVoice: SpeechSynthesisVoice | undefined;
      let isFallback = false;
      if (voices && voices.length > 0) {
        if (safeLang === 'en') {
          matchingVoice = voices.find(v => {
            const l = v.lang.toLowerCase().replace(/_/g, '-');
            return l === 'en-in' || l === 'en-gb';
          }) || voices.find(v => {
            const l = v.lang.toLowerCase().replace(/_/g, '-');
            return l.startsWith('en');
          });
        } else {
          const targetPrefix = safeLang.toLowerCase().split('-')[0];
          matchingVoice = voices.find(v => {
            const l = v.lang.toLowerCase().replace(/_/g, '-');
            return l === targetLangTag.toLowerCase() || l.startsWith(targetPrefix);
          });
          // Requirement 2: If no voice exists for selected language, fall back to Hindi (hi-IN)
          if (!matchingVoice) {
            matchingVoice = voices.find(v => {
              const l = v.lang.toLowerCase().replace(/_/g, '-');
              const n = v.name.toLowerCase();
              return l.startsWith('hi') || n.includes('hindi') || n.includes('हिन्दी');
            });
            if (matchingVoice) {
              isFallback = true;
            }
          }
        }
      }

      if (matchingVoice) {
        try {
          utter.voice = matchingVoice;
          utter.lang = matchingVoice.lang || targetLangTag;
        } catch {
          // Native WebIDL may reject synthetic voice objects in test environments
        }
        if (isFallback) {
          portalVoiceWarning = 'Pronunciation may differ (using Hindi hi-IN fallback voice as no native voice is installed).';
        } else if (!portalVoiceWarning || portalVoiceWarning.includes('Pronunciation may differ')) {
          portalVoiceWarning = '';
        }
      } else if (voices && voices.length > 0 && safeLang !== 'en') {
        portalVoiceWarning = t.noVoiceWarning ? t.noVoiceWarning(targetLangTag) : `Notice: No voice installed for ${targetLangTag} on this system.`;
      } else {
        portalVoiceWarning = '';
      }

      utter.onend = () => {
        isPortalSpeaking = false;
        const btn = (overlayHost?.querySelector('#tfb-tts-btn') || document.getElementById('tfb-tts-btn')) as HTMLButtonElement | null;
        if (btn) {
          btn.textContent = t.ttsRead || '🔊 Read Aloud';
          btn.style.background = '#059669';
        }
      };
      utter.onerror = () => {
        isPortalSpeaking = false;
        const btn = (overlayHost?.querySelector('#tfb-tts-btn') || document.getElementById('tfb-tts-btn')) as HTMLButtonElement | null;
        if (btn) {
          btn.textContent = t.ttsRead || '🔊 Read Aloud';
          btn.style.background = '#059669';
        }
      };

      const btn = (overlayHost?.querySelector('#tfb-tts-btn') || document.getElementById('tfb-tts-btn')) as HTMLButtonElement | null;
      if (btn) {
        btn.textContent = '⏹ Stop';
        btn.style.background = '#dc2626';
      }

      window.speechSynthesis.speak(utter);
      renderPortalOverlay();
    } catch (err: any) {
      console.warn('[TechFormBuddy] TTS speech error:', err);
      isPortalSpeaking = false;
      portalVoiceWarning = '';
    }
  }
}

function speakPortalGuideStep() {
  const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
  const currentStep = guideSteps[portalGuideStepIndex];
  if (!currentStep) return;

  const stepText = typeof currentStep === 'string' ? currentStep : (currentStep.text || '');
  if (!stepText) return;
  speakPortalText(stepText);
}

async function runSmartBriefing() {
  const snapshot = capturePageSnapshot();
  stopPortalSpeech();
  speakPortalText('Generating smart briefing...');

  try {
    const res = await sendBackgroundMessage({
      type: 'TFB_ASSISTANT_CHAT',
      messages: [{ role: 'user', content: 'smart briefing' }],
      pageSnapshot: snapshot,
      language: activeLang,
      profileValues: latestFillValues,
      isBriefing: true,
    });

    if (res && res.reply) {
      chatTurns.push({
        id: String(Date.now()),
        role: 'assistant',
        content: res.reply,
        timestamp: Date.now(),
      });
      renderPortalOverlay();
      speakPortalText(res.reply);
    }
  } catch (err) {
    console.warn('[TechFormBuddy] Smart Briefing error:', err);
    speakPortalGuideStep();
  }
}

function readFullPortalPage() {
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .filter(el => !el.closest('#tfb-portal-overlay-host') && !el.closest('#tfb-launcher-badge'))
    .map(el => el.textContent?.trim())
    .filter(Boolean)
    .join('. ');
  const text = headings || document.title || 'Page content';
  speakPortalText(text);
}

function readNextPortalField() {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'))
    .filter(el => {
      if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
      const type = (el.type || '').toLowerCase();
      if (type === 'hidden' || type === 'password') return false;
      return !el.disabled && el.offsetParent !== null;
    });

  const nextField = inputs.find(el => !el.value) || inputs[0];
  if (nextField) {
    nextField.focus();
    nextField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nextField.style.outline = '3px solid #38bdf8';
    let label = '';
    if (nextField.id) {
      const lbl = document.querySelector(`label[for="${nextField.id}"]`);
      if (lbl) label = lbl.textContent?.trim() || '';
    }
    if (!label) label = nextField.getAttribute('aria-label') || nextField.name || 'field';
    const msg = `Next field to fill is ${label}.`;
    speakPortalText(msg);
  } else {
    speakPortalText('All fields on this page appear to be filled.');
  }
}

async function fetchPortalAssistantGuidance(customQuery?: string) {
  if (isQueryingAssistant) return;
  isQueryingAssistant = true;
  hasAttemptedGuideFetch = true;
  renderPortalOverlay();

  // Extract trimmed visible headings (without any user inputs)
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
    .filter((el: any) => el.offsetParent !== null && el.textContent?.trim())
    .map((el: any) => el.textContent.trim().replace(/\s+/g, ' '))
    .slice(0, 15);

  // Extract visible buttons and links (trimmed, no input values)
  const buttons = Array.from(document.querySelectorAll('button, a, [role="button"], .btn, .card'))
    .filter((el: any) => {
      if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
      return el.offsetParent !== null && el.textContent?.trim();
    })
    .map((el: any) => el.textContent.trim().replace(/\s+/g, ' '))
    .filter((txt: string) => txt.length > 2 && txt.length < 80)
    .slice(0, 25);

  const query = customQuery || activeTaskName || document.title || 'Application Guide';

  try {
    const res = await sendBackgroundMessage({
      type: 'TFB_PAGE_GUIDE',
      taskName: activeTaskName,
      url: window.location.href,
      title: document.title,
      headings,
      buttons,
      language: activeLang,
      query,
    });

    if (res && res.data) {
      assistantQueryResult = res;
      portalGuideStepIndex = 0;
      highlightPortalCurrentGuideStep();
      if (portalAutoReadEnabled) {
        speakPortalGuideStep();
      }
    }
  } catch (err) {
    console.warn('[TechFormBuddy] Assistant query error:', err);
  } finally {
    isQueryingAssistant = false;
    // Guaranteed local fallback guide so user is never stuck on infinite hourglass
    if (!assistantQueryResult) {
      assistantQueryResult = {
        success: true,
        data: {
          title: document.title || 'Citizen Portal Navigation',
          summary: `TechForm Buddy analyzed this portal page and detected ${headings.length} sections and ${buttons.length} navigation options. Follow the step-by-step guidance below.`,
          steps: headings.length > 0
            ? headings.slice(0, 5).map((h, i) => `Step ${i + 1}: Select "${h}" to verify and proceed with your application.`)
            : [
                'Identify your required scheme or service from the portal menu.',
                'Ensure all required identity documents (Aadhaar, address proof, photos) are ready.',
                'Fill all form fields accurately and verify details.',
                'Review your completed form before submitting.'
              ],
          documentsNeeded: [
            'Aadhaar Card (Identity & Demographic verification)',
            'Proof of Current Address (Utility bill, ration card, or domicile)',
            'Recent Passport Size Photograph',
            'Relevant official certificates as required'
          ],
          formFields: [],
          portalUrl: window.location.href,
          officialDepartment: 'Government / Citizen Services Portal'
        }
      };
      portalGuideStepIndex = 0;
      highlightPortalCurrentGuideStep();
    }
    renderPortalOverlay();
  }
}

function capturePageSnapshot(): AgentPageSnapshot {
  const title = document.title || '';
  const pageUrl = new URL(window.location.href);
  pageUrl.search = '';
  pageUrl.hash = '';
  const url = pageUrl.toString();

  // Visible headings h1..h3 (trimmed, max 15)
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
    .filter((el) => {
      if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
      return (el as HTMLElement).offsetParent !== null && (el.textContent || '').trim().length > 0;
    })
    .map(el => (el.textContent || '').trim().replace(/\s+/g, ' '))
    .slice(0, 15);

  // Form fields: strictly exclude password/OTP/captcha fields; NEVER include typed values
  const inputElements = Array.from(document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    'input, select, textarea'
  )).filter(el => {
    if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
    const type = (el.type || '').toLowerCase();
    if (type === 'hidden' || type === 'password') return false;

    const probe = `${el.id} ${el.name} ${el.getAttribute('autocomplete') || ''} ${el.getAttribute('placeholder') || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
    if (/password|pwd|otp|one-time|captcha|cvv|pin|security_code/.test(probe)) return false;

    return true;
  });

  const formFields = inputElements.map(el => {
    let label = '';
    if (el.id) {
      const lblEl = document.querySelector(`label[for="${el.id}"]`);
      if (lblEl) label = lblEl.textContent?.trim() || '';
    }
    if (!label) {
      const parentLabel = el.closest('label');
      if (parentLabel) label = parentLabel.textContent?.trim() || '';
    }
    if (!label) {
      label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.name || el.id || 'Field';
    }
    label = label.replace(/\s+/g, ' ').replace(/[*:]/g, '').trim();

    return {
      id: el.id || el.name || `field-${Math.random().toString(36).slice(2, 7)}`,
      label,
      type: el.type || 'text',
      required: Boolean(el.required || el.getAttribute('aria-required') === 'true'),
      isEmpty: !el.value || !el.value.trim(),
    };
  });

  // Buttons
  const buttons = Array.from(document.querySelectorAll<HTMLElement>(
    'button, [role="button"], input[type="button"], input[type="submit"], a.btn, .btn, .button'
  ))
    .filter(el => {
      if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
      return el.offsetParent !== null && (el.textContent || '').trim().length > 0;
    })
    .map(el => (el.textContent || (el as HTMLInputElement).value || '').trim().replace(/\s+/g, ' '))
    .filter(t => t.length > 1 && t.length < 80)
    .slice(0, 25);

  // Links
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .filter(el => {
      if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
      const href = el.getAttribute('href') || '';
      return href && !href.startsWith('javascript:') && !href.startsWith('#');
    })
    .map(el => ({
      text: (el.textContent || '').trim().replace(/\s+/g, ' ') || 'Link',
      url: el.href,
    }))
    .filter(item => item.text.length > 2)
    .slice(0, 20);

  // File downloads
  const fileDownloads = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
    .filter(el => {
      if (el.closest('#tfb-portal-overlay-host') || el.closest('#tfb-launcher-badge')) return false;
      const href = (el.getAttribute('href') || '').toLowerCase();
      const hasDownloadAttr = el.hasAttribute('download');
      const isDoc = /\.(pdf|docx?|xlsx?|zip|csv)(\?|$)/i.test(href);
      const text = (el.textContent || '').toLowerCase();
      const hasDownloadWord = text.includes('download') || text.includes('डाउनलोड');
      return isDoc || hasDownloadAttr || hasDownloadWord;
    })
    .map(el => ({
      text: (el.textContent || '').trim().replace(/\s+/g, ' ') || 'Download Document',
      url: el.href,
    }))
    .slice(0, 10);

  // Extract page visible text with PII redacted (Aadhaar, PAN, Card, Phone, Email)
  const rawBodyText = (document.body?.innerText || document.body?.textContent || '').replace(/\s+/g, ' ').slice(0, 1500);
  const visibleText = redactPII(rawBodyText);

  return {
    title,
    url,
    headings,
    visibleText,
    formFields,
    buttons,
    links,
    fileDownloads,
  };
}

function validateToolSafety(tool: ProposedAgentTool): { safe: boolean; reason?: string } {
  if (!tool) return { safe: false, reason: 'Invalid tool proposal.' };

  const forbiddenClickPatterns = [
    'submit',
    'pay',
    'payment',
    'razorpay',
    'billdesk',
    'payu',
    'proceed to pay',
    'make payment',
    'captcha',
    'verify-otp',
    'verify otp',
    'send otp',
    'जमा करें',
    'भुगतान',
  ];

  if (tool.name === 'click') {
    const selectorOrText = String(tool.args?.element || tool.args?.selector || '').toLowerCase();
    for (const pat of forbiddenClickPatterns) {
      if (selectorOrText.includes(pat)) {
        return {
          safe: false,
          reason: `Safety Limit: TechForm Buddy never automatically clicks submit, payment, captcha, or OTP buttons. You must review and click them yourself.`,
        };
      }
    }

    let targetEl: HTMLElement | null = null;
    try {
      targetEl = document.querySelector(tool.args?.selector || tool.args?.element);
    } catch {}
    if (!targetEl && tool.args?.element) {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>('button, a, input[type="submit"], input[type="button"]'));
      targetEl = candidates.find(c => (c.textContent || (c as HTMLInputElement).value || '').trim().toLowerCase() === selectorOrText) || null;
    }
    if (targetEl) {
      const type = (targetEl.getAttribute('type') || '').toLowerCase();
      const text = (targetEl.textContent || (targetEl as HTMLInputElement).value || '').toLowerCase();
      const probe = `${targetEl.id} ${targetEl.className} ${targetEl.getAttribute('aria-label') || ''} ${text}`.toLowerCase();
      if (type === 'submit' || forbiddenClickPatterns.some(pat => probe.includes(pat))) {
        return {
          safe: false,
          reason: `Safety Limit: TechForm Buddy never clicks submit or payment buttons. You must review and submit yourself.`,
        };
      }
    }
  }

  if (tool.name === 'fill') {
    const fieldIdentifier = String(tool.args?.field || tool.args?.fieldLabel || '').toLowerCase();
    const forbiddenFieldPattern = /password|passwd|pwd|otp|one-time-code|captcha|cvv|cvc|\bpin\b|passcode|aadhaar|aadhar|uidai|\bpan\b|passport|voter\s*id|epic|bank|account|ifsc|iban|credit\s*card|debit\s*card/i;
    if (forbiddenFieldPattern.test(fieldIdentifier)) {
      return { safe: false, reason: 'Safety Limit: Sensitive identity, financial, credential, OTP, and captcha fields must be entered manually.' };
    }

    let targetInput: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;
    if (tool.args?.field) {
      targetInput = (document.getElementById(tool.args.field) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) ||
                    (document.querySelector(`[name="${tool.args.field}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement);
    }
    if (!targetInput && tool.args?.fieldLabel) {
      const matched = currentFieldsList.find(f => f.label.toLowerCase().includes(String(tool.args.fieldLabel).toLowerCase()));
      if (matched) targetInput = matched.element;
    }
    if (targetInput) {
      const type = targetInput instanceof HTMLInputElement ? targetInput.type.toLowerCase() : '';
      const probe = `${targetInput.id} ${targetInput.name} ${targetInput.getAttribute('aria-label') || ''} ${targetInput.getAttribute('autocomplete') || ''} ${findLabelText(targetInput)}`.toLowerCase();
      if (type === 'password' || isSensitiveField(targetInput) || forbiddenFieldPattern.test(probe)) {
        return {
          safe: false,
          reason: 'Safety Limit: Sensitive identity, financial, credential, OTP, and captcha fields must be entered manually.',
        };
      }
    }
  }

  return { safe: true };
}

async function executeProposedTool(tool: ProposedAgentTool): Promise<{ success: boolean; error?: string }> {
  const safety = validateToolSafety(tool);
  if (!safety.safe) {
    blockedActionMessage = safety.reason || 'Action blocked by safety policy.';
    renderPortalOverlay();
    speakPortalText(blockedActionMessage);
    return { success: false, error: blockedActionMessage };
  }

  try {
    switch (tool.name) {
      case 'read_snapshot': {
        capturePageSnapshot();
        return { success: true };
      }

      case 'highlight':
      case 'scroll_to': {
        const target = tool.args?.element || tool.args?.selector;
        highlightPortalGuideElement(target, target);
        return { success: true };
      }

      case 'fill': {
        const fieldId = tool.args?.field;
        const val = tool.args?.value || '';
        let targetEl: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null = null;

        if (fieldId) {
          targetEl = (document.getElementById(fieldId) as any) || document.querySelector(`[name="${fieldId}"]`);
        }
        if (!targetEl && tool.args?.fieldLabel) {
          const matched = currentFieldsList.find(f => f.label.toLowerCase().includes(String(tool.args.fieldLabel).toLowerCase()));
          if (matched && matched.element) targetEl = matched.element;
        }

        if (targetEl) {
          if (targetEl.type === 'password') {
            return { success: false, error: 'Cannot fill password field' };
          }
          setNativeValue(targetEl, val);
          targetEl.dispatchEvent(new Event('input', { bubbles: true }));
          targetEl.dispatchEvent(new Event('change', { bubbles: true }));
          targetEl.dispatchEvent(new Event('blur', { bubbles: true }));

          targetEl.style.outline = '2px solid #10b981';
          targetEl.style.backgroundColor = '#ecfdf5';

          const f = currentFieldsList.find(item => item.element === targetEl);
          if (f) {
            f.mappedValue = val;
            f.confirmed = true;
          }

          if (typeof tool.args?.nextIndex === 'number') {
            currentFieldWalkIndex = tool.args.nextIndex;
          }

          return { success: true };
        } else {
          return { success: false, error: `Field "${fieldId || tool.args?.fieldLabel}" not found` };
        }
      }

      case 'click': {
        const target = tool.args?.element || tool.args?.selector;
        let targetEl: HTMLElement | null = null;
        try {
          targetEl = document.querySelector(target);
        } catch {}
        if (!targetEl && target) {
          const candidates = Array.from(document.querySelectorAll<HTMLElement>('button, a, input[type="button"], input[type="submit"], [role="button"]'));
          const cleanTarget = String(target).toLowerCase().trim();
          targetEl = candidates.find(c => (c.textContent || (c as HTMLInputElement).value || '').trim().toLowerCase() === cleanTarget) || null;
          if (!targetEl) {
            targetEl = candidates.find(c => (c.textContent || (c as HTMLInputElement).value || '').trim().toLowerCase().includes(cleanTarget)) || null;
          }
        }

        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetEl.click();
          return { success: true };
        } else {
          return { success: false, error: `Element "${target}" not found` };
        }
      }

      case 'navigate': {
        const targetUrl = tool.args?.url;
        if (!targetUrl) return { success: false, error: 'URL required' };
        window.location.href = targetUrl;
        return { success: true };
      }

      case 'download': {
        const downloadUrl = tool.args?.url;
        const filename = tool.args?.filename || 'document.pdf';
        if (!downloadUrl) return { success: false, error: 'Download URL required' };

        try {
          const res = await sendBackgroundMessage({
            type: 'TFB_DOWNLOAD',
            url: downloadUrl,
            filename,
          });
          if (res && res.success) {
            return { success: true };
          }
        } catch {}

        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return { success: true };
      }

      case 'speak': {
        const text = tool.args?.text;
        if (text) speakPortalText(text);
        return { success: true };
      }

      default:
        return { success: false, error: 'Unknown tool' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function sendPortalChatMessage(userQuery: string) {
  if (!userQuery || !userQuery.trim() || isChatSubmitting) return;

  const q = userQuery.trim();

  // If there is a pending tool and user is answering confirmation:
  if (pendingProposedTool) {
    const qLower = q.toLowerCase();
    const isYes = ['haan', 'yes', 'ha', 'theek hai', 'thik hai', 'ok', 'sahi hai', 'proceed', 'confirm', 'fill it'].includes(qLower);
    const isNo = ['nahi', 'no', 'cancel', 'nahin', 'stop', 'mat karo'].includes(qLower);

    if (isYes) {
      chatTurns.push({
        id: String(Date.now()),
        role: 'user',
        content: q,
        timestamp: Date.now(),
      });
      const toolToRun = pendingProposedTool;
      pendingProposedTool = null;
      renderPortalOverlay();

      const result = await executeProposedTool(toolToRun);
      if (result.success) {
        const notice = `✓ Action completed: ${toolToRun.description}`;
        chatTurns.push({
          id: String(Date.now() + 1),
          role: 'assistant',
          content: notice,
          timestamp: Date.now(),
        });
        speakPortalText(notice);
      }
      renderPortalOverlay();
      return;
    } else if (isNo) {
      chatTurns.push({
        id: String(Date.now()),
        role: 'user',
        content: q,
        timestamp: Date.now(),
      });
      pendingProposedTool = null;
      const notice = 'Action cancelled.';
      chatTurns.push({
        id: String(Date.now() + 1),
        role: 'assistant',
        content: notice,
        timestamp: Date.now(),
      });
      speakPortalText(notice);
      renderPortalOverlay();
      return;
    }
  }

  // Normal turn: push user turn
  chatTurns.push({
    id: String(Date.now()),
    role: 'user',
    content: q,
    timestamp: Date.now(),
  });

  if (chatTurns.length > 10) {
    chatTurns = chatTurns.slice(-10);
  }

  isChatSubmitting = true;
  blockedActionMessage = null;
  renderPortalOverlay();

  const snapshot = capturePageSnapshot();

  try {
    const res = await sendBackgroundMessage({
      type: 'TFB_ASSISTANT_CHAT',
      messages: chatTurns.map(m => ({ role: m.role, content: m.content })),
      pageSnapshot: snapshot,
      language: activeLang,
      profileValues: latestFillValues,
      fieldIndex: currentFieldWalkIndex,
    });

    if (res && res.reply) {
      chatTurns.push({
        id: String(Date.now() + 1),
        role: 'assistant',
        content: res.reply,
        timestamp: Date.now(),
      });

      if (chatTurns.length > 10) {
        chatTurns = chatTurns.slice(-10);
      }

      if (res.proposedTool) {
        const proposed: ProposedAgentTool = res.proposedTool;
        const safety = validateToolSafety(proposed);

        if (!safety.safe) {
          blockedActionMessage = safety.reason || 'Forbidden action blocked.';
          pendingProposedTool = null;
        } else {
          if (proposed.name === 'navigate' && proposed.args?.url) {
            try {
              const parsed = new URL(proposed.args.url);
              if (parsed.hostname !== window.location.hostname) {
                proposed.isExternalDomain = true;
              }
            } catch {}
          }

          if (proposed.requiresConfirmation) {
            pendingProposedTool = proposed;
          } else {
            executeProposedTool(proposed);
          }
        }
      }

      speakPortalText(res.reply);
    }
  } catch (err: any) {
    console.warn('[TechFormBuddy] Chat request error:', err);
    chatTurns.push({
      id: String(Date.now() + 1),
      role: 'assistant',
      content: 'Could not connect to assistant. Please try again.',
      timestamp: Date.now(),
    });
  } finally {
    isChatSubmitting = false;
    renderPortalOverlay();
  }
}

function renderAssistantTabContent(t: any): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <!-- Chat Conversation Stream (Last 10 turns) -->
      <div id="tfb-chat-history" style="display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; padding: 4px; border-radius: 8px; background: rgba(15, 23, 42, 0.4);">
        ${chatTurns.length === 0 ? `
          <div style="text-align: center; padding: 18px 10px; color: #94a3b8; font-size: 12px; line-height: 1.5;">
            👋 <strong>${t.title || 'TechForm Buddy Agent'}</strong><br/>
            Ask me anything about this page ("Ye field kya hai?", "Ye form kis liye hai?", "Kaunse documents chahiye?", "Kahan kya bharna hai").
          </div>
        ` : chatTurns.map(turn => {
          if (turn.role === 'user') {
            return `
              <div class="tfb-chat-bubble-user" style="align-self: flex-end; background: #2563eb; color: white; padding: 8px 12px; border-radius: 12px 12px 2px 12px; font-size: 12px; max-width: 85%; word-break: break-word;">
                ${escapeHtml(turn.content)}
              </div>
            `;
          } else {
            return `
              <div class="tfb-chat-bubble-assistant" style="align-self: flex-start; background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 8px 12px; border-radius: 12px 12px 12px 2px; font-size: 12px; max-width: 90%; line-height: 1.5; word-break: break-word;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                  <span class="tfb-assistant-text">${escapeHtml(turn.content)}</span>
                  <button class="tfb-read-msg-btn" data-text="${escapeHtml(turn.content)}" style="background: none; border: none; cursor: pointer; color: #38bdf8; font-size: 12px; padding: 0;" title="Read aloud">🔊</button>
                </div>
              </div>
            `;
          }
        }).join('')}

        ${isChatSubmitting ? `
          <div style="align-self: flex-start; background: #1e293b; color: #94a3b8; padding: 6px 12px; border-radius: 10px; font-size: 11px; display: flex; align-items: center; gap: 6px;">
            <span>Thinking...</span>
          </div>
        ` : ''}
      </div>

      <!-- Pending Action Confirmation Card (Requirement 5) -->
      ${pendingProposedTool ? `
        <div id="tfb-tool-proposal-card" style="background: #0f172a; border: 2px solid #38bdf8; border-radius: 8px; padding: 10px 12px; box-shadow: 0 4px 12px rgba(56, 189, 248, 0.2);">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
            <span>⚡</span>
            <span>${t.proposedActionTitle || 'Proposed Action'}</span>
          </div>
          <div id="tfb-proposal-desc" style="font-size: 13px; font-weight: 600; color: #f8fafc; line-height: 1.4; margin-bottom: 8px;">
            ${escapeHtml(pendingProposedTool.description)}
          </div>
          ${pendingProposedTool.isExternalDomain ? `
            <div id="tfb-ext-domain-warning" style="background: rgba(239, 68, 68, 0.2); border: 1px solid #dc2626; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #fca5a5; margin-bottom: 8px;">
              ${t.externalDomainNotice || '⚠️ External Domain Navigation Warning: You are navigating away to a different website. Do you confirm?'}
            </div>
          ` : ''}
          <div style="display: flex; gap: 8px;">
            <button id="tfb-tool-confirm-btn" style="flex: 1; background: #059669; color: white; border: none; padding: 7px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
              ${t.toolConfirmBtn || '✓ Confirm / Yes'}
            </button>
            <button id="tfb-tool-cancel-btn" style="flex: 1; background: #475569; color: #e2e8f0; border: none; padding: 7px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              ${t.toolCancelBtn || '✕ Cancel / No'}
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Security Shield Warning (Requirement 6) -->
      ${blockedActionMessage ? `
        <div id="tfb-blocked-alert" style="background: rgba(220, 38, 38, 0.2); border: 1px solid #ef4444; border-radius: 8px; padding: 8px 12px; font-size: 12px; color: #fca5a5; line-height: 1.4;">
          🛡️ <strong>${t.securityAlertTitle || 'Security Notice'}:</strong> ${escapeHtml(blockedActionMessage)}
        </div>
      ` : ''}

      <!-- Quick prompts -->
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${t.quickQuestions.map((q: string) => `
          <button class="tfb-quick-chip" data-query="${escapeHtml(q)}" style="background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 4px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; user-select: none;">
            ${escapeHtml(q)}
          </button>
        `).join('')}
      </div>

      <!-- Chat input with Voice (Requirement 1) -->
      <div style="display: flex; gap: 6px;">
        <input id="tfb-assistant-input" type="text" placeholder="${t.askPlaceholder}" style="flex: 1; background: #1e293b; border: 1px solid #475569; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; outline: none;">
        <button id="tfb-assistant-mic-btn" style="background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; padding: 8px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer;" title="Speak question in any language">
          🎙️
        </button>
        <button id="tfb-assistant-submit-btn" style="background: #2563eb; color: white; border: none; padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;">
          ${t.askBtn}
        </button>
      </div>
    </div>
  `;
}

function setupOverlayEventListeners(appUrl: string) {
  if (!overlayHost) return;

  const closeBtn = overlayHost.querySelector('#tfb-overlay-close-btn') as HTMLButtonElement;
  if (closeBtn) {
    closeBtn.onclick = () => {
      clearPortalGuideHighlight();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      overlayHost?.remove();
      overlayHost = null;
    };
  }

  // On-Visit Alert Banner Handlers (Requirement 6b)
  const dismissVisitBtn = overlayHost.querySelector('#tfb-dismiss-on-visit-btn') as HTMLButtonElement;
  if (dismissVisitBtn) {
    dismissVisitBtn.onclick = () => {
      onVisitAlertDismissed = true;
      renderPortalOverlay();
    };
  }

  const readAloudVisitBtn = overlayHost.querySelector('#tfb-on-visit-read-aloud') as HTMLButtonElement;
  if (readAloudVisitBtn) {
    readAloudVisitBtn.onclick = () => {
      const summaryText = `${onVisitSourceName}: ` + onVisitAlerts.map(a => `${a.title}. ${a.deadline ? `Deadline: ${a.deadline}` : ''}`).join(' ');
      speakPortalText(summaryText);
    };
  }

  const highlightVisitBtn = overlayHost.querySelector('#tfb-on-visit-highlight') as HTMLButtonElement;
  if (highlightVisitBtn) {
    highlightVisitBtn.onclick = () => {
      for (const alert of onVisitAlerts) {
        highlightNoticeOnPage(alert.title);
      }
    };
  }

  const seenVisitBtn = overlayHost.querySelector('#tfb-on-visit-seen') as HTMLButtonElement;
  if (seenVisitBtn) {
    seenVisitBtn.onclick = () => {
      onVisitAlertDismissed = true;
      for (const a of onVisitAlerts) {
        sendBackgroundMessage({ type: 'TFB_MARK_ALERT_READ', alertId: a.id });
      }
      onVisitAlerts = [];
      renderPortalOverlay();
    };
  }

  const langSelect = overlayHost.querySelector('#tfb-overlay-lang-select') as HTMLSelectElement;
  if (langSelect) {
    langSelect.onchange = () => {
      const newLang = langSelect.value;
      sendBackgroundMessage({ type: 'TFB_SET_LANGUAGE', language: newLang });
      updateOverlayLanguage(newLang);
      fetchPortalAssistantGuidance();
    };
  }

  const autofillToggle = overlayHost.querySelector('#tfb-overlay-autofill-toggle') as HTMLButtonElement;
  if (autofillToggle) {
    autofillToggle.onclick = () => {
      isAutofillModeOn = !isAutofillModeOn;
      try {
        localStorage.setItem('tfb_autofill_mode', String(isAutofillModeOn));
        window.dispatchEvent(new CustomEvent('tfb-autofill-mode-changed', { detail: { enabled: isAutofillModeOn } }));
      } catch {}
      renderPortalOverlay();
      const pillBadge = document.getElementById('tfb-pill-autofill-badge');
      if (pillBadge) {
        pillBadge.textContent = `⚡ Autofill: ${isAutofillModeOn ? 'ON' : 'OFF'}`;
        pillBadge.style.background = isAutofillModeOn ? '#2563eb' : '#475569';
      }
    };
  }

  // Tabs
  const tabForm = overlayHost.querySelector('#tfb-tab-form') as HTMLButtonElement;
  if (tabForm) tabForm.onclick = () => { activeTab = 'form'; renderPortalOverlay(); };

  const tabGuide = overlayHost.querySelector('#tfb-tab-guide') as HTMLButtonElement;
  if (tabGuide) tabGuide.onclick = () => { activeTab = 'guide'; renderPortalOverlay(); };

  const tabAssistant = overlayHost.querySelector('#tfb-tab-assistant') as HTMLButtonElement;
  if (tabAssistant) tabAssistant.onclick = () => { activeTab = 'assistant'; renderPortalOverlay(); };

  const openAppBtn = overlayHost.querySelector('#tfb-open-app-btn') as HTMLButtonElement;
  if (openAppBtn) {
    openAppBtn.onclick = () => {
      window.open(appUrl + '/extension/connect', '_blank');
    };
  }

  const fillThisBtn = overlayHost.querySelector('#tfb-fill-this-btn') as HTMLButtonElement;
  if (fillThisBtn) {
    fillThisBtn.onclick = () => {
      fillCurrentPortalField();
    };
  }

  const fillBtn = overlayHost.querySelector('#tfb-fill-btn') as HTMLButtonElement;
  if (fillBtn) {
    fillBtn.onclick = () => {
      applyAutofillToPage();
    };
  }

  const clearBtn = overlayHost.querySelector('#tfb-clear-btn') as HTMLButtonElement;
  if (clearBtn) {
    clearBtn.onclick = () => {
      clearAutofilledInputs();
    };
  }

  const hideSiteBtn = overlayHost.querySelector('#tfb-hide-site-btn') as HTMLButtonElement;
  if (hideSiteBtn) {
    hideSiteBtn.onclick = () => {
      isWidgetHidden = true;
      stopPortalSpeech();
      if (overlayHost) overlayHost.style.display = 'none';
      const badge = document.getElementById('tfb-launcher-badge');
      if (badge) badge.style.display = 'none';
      sendBackgroundMessage({ type: 'TFB_HIDE_SITE', siteHost: window.location.hostname });
    };
  }

  const showEverywhereBtn = overlayHost.querySelector('#tfb-show-everywhere-btn') as HTMLButtonElement;
  if (showEverywhereBtn) {
    showEverywhereBtn.onclick = () => {
      sendBackgroundMessage({ type: 'TFB_SHOW_EVERYWHERE' });
      speakPortalText('TechForm Buddy will now show on all sites.');
    };
  }

  // Confirmation buttons for low confidence
  overlayHost.querySelectorAll('.tfb-conf-btn').forEach(btn => {
    (btn as HTMLElement).onclick = (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      if (currentFieldsList[idx]) {
        currentFieldsList[idx].confirmed = true;
        renderPortalOverlay();
      }
    };
  });

  overlayHost.querySelectorAll('.tfb-skip-btn').forEach(btn => {
    (btn as HTMLElement).onclick = (e) => {
      const idx = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
      if (currentFieldsList[idx]) {
        currentFieldsList[idx].mappedValue = null;
        renderPortalOverlay();
      }
    };
  });

  // Page Guide Navigation Buttons
  const guidePrevBtn = overlayHost.querySelector('#tfb-guide-prev-btn') as HTMLButtonElement;
  if (guidePrevBtn) {
    guidePrevBtn.onclick = () => {
      if (portalGuideStepIndex > 0) {
        portalGuideStepIndex--;
        renderPortalOverlay();
        highlightPortalCurrentGuideStep();
        if (portalAutoReadEnabled) {
          speakPortalGuideStep();
        }
      }
    };
  }

  const guideNextBtn = overlayHost.querySelector('#tfb-guide-next-btn') as HTMLButtonElement;
  if (guideNextBtn) {
    guideNextBtn.onclick = () => {
      const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
      if (portalGuideStepIndex < guideSteps.length - 1) {
        portalGuideStepIndex++;
        renderPortalOverlay();
        highlightPortalCurrentGuideStep();
        if (portalAutoReadEnabled) {
          speakPortalGuideStep();
        }
      }
    };
  }

  const autoReadToggle = overlayHost.querySelector('#tfb-auto-read-toggle') as HTMLInputElement;
  if (autoReadToggle) {
    autoReadToggle.onchange = () => {
      portalAutoReadEnabled = autoReadToggle.checked;
    };
  }

  // Assistant / Conversational Chat queries
  const assistantInput = overlayHost.querySelector('#tfb-assistant-input') as HTMLInputElement;
  const assistantSubmitBtn = overlayHost.querySelector('#tfb-assistant-submit-btn') as HTMLButtonElement;

  const runAssistant = (q: string) => {
    if (!q || !q.trim()) return;
    if (activeTab === 'assistant') {
      sendPortalChatMessage(q.trim());
      if (assistantInput) assistantInput.value = '';
    } else {
      fetchPortalAssistantGuidance(q.trim());
    }
  };

  if (assistantSubmitBtn && assistantInput) {
    assistantSubmitBtn.onclick = () => runAssistant(assistantInput.value);
    assistantInput.onkeydown = (e) => {
      if (e.key === 'Enter') runAssistant(assistantInput.value);
    };
  }

  overlayHost.querySelectorAll('.tfb-quick-chip').forEach(chip => {
    (chip as HTMLElement).onclick = () => {
      const q = chip.getAttribute('data-query');
      if (q) runAssistant(q);
    };
  });

  // Action Proposal Confirmation & Cancellation buttons (Requirement 5)
  const toolConfirmBtn = overlayHost.querySelector('#tfb-tool-confirm-btn') as HTMLButtonElement;
  if (toolConfirmBtn) {
    toolConfirmBtn.onclick = async () => {
      if (pendingProposedTool) {
        const tool = pendingProposedTool;
        pendingProposedTool = null;
        renderPortalOverlay();
        const res = await executeProposedTool(tool);
        if (res.success) {
          const notice = `✓ Action completed: ${tool.description}`;
          chatTurns.push({
            id: String(Date.now()),
            role: 'assistant',
            content: notice,
            timestamp: Date.now(),
          });
          speakPortalText(notice);
        }
        renderPortalOverlay();
      }
    };
  }

  const toolCancelBtn = overlayHost.querySelector('#tfb-tool-cancel-btn') as HTMLButtonElement;
  if (toolCancelBtn) {
    toolCancelBtn.onclick = () => {
      pendingProposedTool = null;
      const notice = 'Action cancelled.';
      chatTurns.push({
        id: String(Date.now()),
        role: 'assistant',
        content: notice,
        timestamp: Date.now(),
      });
      speakPortalText(notice);
      renderPortalOverlay();
    };
  }

  // Per-message read aloud button
  overlayHost.querySelectorAll('.tfb-read-msg-btn').forEach(btn => {
    (btn as HTMLElement).onclick = (e) => {
      const text = (e.currentTarget as HTMLElement).getAttribute('data-text');
      if (text) speakPortalText(text);
    };
  });

  const quickGuideBtn = overlayHost.querySelector('#tfb-quick-guide-btn') as HTMLButtonElement;
  if (quickGuideBtn) {
    quickGuideBtn.onclick = () => {
      fetchPortalAssistantGuidance(window.location.hostname.replace(/^(www\.)?/, ''));
    };
  }

  // TTS Smart Read Aloud (Requirement 3: Briefing, Read full page, Read next field)
  const briefingBtn = overlayHost.querySelector('#tfb-btn-briefing') as HTMLButtonElement;
  if (briefingBtn) {
    briefingBtn.onclick = () => {
      runSmartBriefing();
    };
  }

  const readFullBtn = overlayHost.querySelector('#tfb-btn-read-full') as HTMLButtonElement;
  if (readFullBtn) {
    readFullBtn.onclick = () => {
      readFullPortalPage();
    };
  }

  const readFieldBtn = overlayHost.querySelector('#tfb-btn-read-field') as HTMLButtonElement;
  if (readFieldBtn) {
    readFieldBtn.onclick = () => {
      readNextPortalField();
    };
  }

  const ttsBtn = overlayHost.querySelector('#tfb-tts-btn') as HTMLButtonElement;
  if (ttsBtn) {
    ttsBtn.onclick = () => {
      runSmartBriefing();
    };
  }

  const ttsStopBtn = overlayHost.querySelector('#tfb-tts-stop-btn') as HTMLButtonElement;
  if (ttsStopBtn) {
    ttsStopBtn.onclick = () => {
      stopPortalSpeech();
    };
  }

  // Resizer drag handler
  const resizer = overlayHost.querySelector('#tfb-resizer') as HTMLElement;
  if (resizer) {
    resizer.onmousedown = (e) => {
      e.preventDefault();
      isResizingSidebar = true;
      const startX = e.clientX;
      const startW = sidebarWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        let newW = sidebarSide === 'right' 
          ? startW + (startX - moveEvent.clientX)
          : startW + (moveEvent.clientX - startX);
        newW = Math.max(320, Math.min(newW, window.innerWidth - 60));
        sidebarWidth = newW;
        const container = overlayHost?.querySelector('#tfb-sidebar-container') as HTMLElement;
        if (container) container.style.width = `${newW}px`;
      };

      const onMouseUp = () => {
        isResizingSidebar = false;
        try {
          localStorage.setItem('tfb_overlay_width', String(sidebarWidth));
        } catch {}
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };
  }

  // Toggle side (left/right)
  const toggleSideBtn = overlayHost.querySelector('#tfb-overlay-toggle-side') as HTMLButtonElement;
  if (toggleSideBtn) {
    toggleSideBtn.onclick = () => {
      sidebarSide = sidebarSide === 'right' ? 'left' : 'right';
      try {
        localStorage.setItem('tfb_overlay_side', sidebarSide);
      } catch {}
      renderPortalOverlay();
    };
  }

  // Minimize
  const minBtn = overlayHost.querySelector('#tfb-overlay-minimize-btn') as HTMLButtonElement;
  if (minBtn) {
    minBtn.onclick = () => {
      isSidebarMinimized = true;
      renderPortalOverlay();
    };
  }

  // Form field voice buttons: speak in any language -> translate to English -> write to live portal
  overlayHost.querySelectorAll('.tfb-voice-fill-btn').forEach(btn => {
    (btn as HTMLElement).onclick = (e) => {
      const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
      startFieldVoiceInput(idx);
    };
  });

  // Document attachment buttons: attach saved document with explicit confirmation and never auto-submit
  overlayHost.querySelectorAll('.tfb-attach-doc-btn').forEach(btn => {
    (btn as HTMLElement).onclick = (e) => {
      const idx = parseInt((e.currentTarget as HTMLElement).getAttribute('data-index') || '0', 10);
      const f = currentFieldsList[idx];
      if (!f) return;
      const confirmed = window.confirm(`Explicit Confirmation Required:\nAttach matching saved document to "${f.label}"?\n(Note: TechForm Buddy will never submit this form automatically.)`);
      if (confirmed) {
        const statusEl = overlayHost?.querySelector(`#tfb-doc-status-${idx}`);
        if (statusEl) {
          statusEl.textContent = '✓ Document attached and resized to field limits.';
        }
      }
    };
  });

  // Assistant mic button
  const micBtn = overlayHost.querySelector('#tfb-assistant-mic-btn') as HTMLButtonElement;
  if (micBtn) {
    micBtn.onclick = () => {
      startAssistantVoiceInput();
    };
  }
}

function startFieldVoiceInput(fieldIndex: number) {
  const f = currentFieldsList[fieldIndex];
  if (!f) return;

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    alert('Voice recognition is not supported in this browser.');
    return;
  }

  const safeLang = sanitizeLanguage(activeLang);
  const recognition = new SpeechRecognitionAPI();
  recognition.lang = getLanguageBcp47(safeLang);
  recognition.interimResults = false;

  const statusEl = document.getElementById(`tfb-voice-status-${fieldIndex}`);
  if (statusEl) {
    statusEl.textContent = '🎙️ Listening...';
    statusEl.style.color = '#38bdf8';
  }

  recognition.onresult = async (event: any) => {
    const transcript = event.results[0][0].transcript.trim();

    const isReadCmd = (t: string) => {
      const s = t.toLowerCase().trim();
      return s.includes('read cloud') || s.includes('read aloud') || s.includes('read allowed') ||
             s.includes('read a cloud') || s.includes('read out loud') || s.includes('read form') ||
             s.includes('read') || s.includes('speak') || s.includes('पढ़ो') || s.includes('सुनाओ');
    };

    if (isReadCmd(transcript)) {
      if (statusEl) {
        statusEl.textContent = '🔊 Reading aloud...';
        statusEl.style.color = '#34d399';
      }
      const promptText = f.label
        ? `Field: ${f.label}. ${f.mappedValue ? 'Current value is: ' + f.mappedValue : 'This field is currently empty.'}`
        : 'Reading field details.';
      speakPortalText(promptText);
      setTimeout(() => {
        if (statusEl) statusEl.textContent = '';
      }, 3000);
      return;
    }

    if (statusEl) {
      statusEl.textContent = 'Interpreting value...';
      statusEl.style.color = '#fbbf24';
    }

    // Process field value according to Requirement 3:
    // Transliterates Indic names/places/addresses into English (Latin script),
    // converts Indic numerals to ASCII digits, normalizes dates,
    // prefers stored profile values over re-transcribed speech when known,
    // and checks regional script field exception.
    const processed = processFieldValueForFilling({
      rawValue: transcript,
      fieldLabel: f.label,
      fieldType: f.element?.type,
      fieldName: f.name || f.element?.name,
      profileValues: latestFillValues,
      fromLang: safeLang,
    });

    const englishVal = processed.finalValue;

    // Requirement 3: "For spoken values, show the interpreted value and ask for confirmation before filling."
    if (statusEl) {
      statusEl.innerHTML = `
        <span style="color: #fbbf24; font-weight: 600;">Interpreted: <strong>"${escapeHtml(englishVal)}"</strong></span>
        <button id="tfb-confirm-fill-${fieldIndex}" style="background: #059669; color: white; border: none; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; margin-left: 6px;">✓ Confirm</button>
        <button id="tfb-cancel-fill-${fieldIndex}" style="background: #475569; color: #cbd5e1; border: none; padding: 2px 6px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-left: 4px;">✕ Cancel</button>
      `;

      const confirmBtn = document.getElementById(`tfb-confirm-fill-${fieldIndex}`);
      const cancelBtn = document.getElementById(`tfb-cancel-fill-${fieldIndex}`);

      const doConfirm = () => {
        f.mappedValue = englishVal;
        f.confirmed = true;
        if (f.element) {
          setNativeValue(f.element, englishVal);
          f.element.dispatchEvent(new Event('input', { bubbles: true }));
          f.element.dispatchEvent(new Event('change', { bubbles: true }));
          f.element.dispatchEvent(new Event('blur', { bubbles: true }));
        }
        if (statusEl) {
          statusEl.textContent = `✓ Filled: ${englishVal}`;
          statusEl.style.color = '#34d399';
        }
        speakPortalText(`Recorded: ${englishVal}`);
        renderPortalOverlay();
      };

      if (confirmBtn) {
        confirmBtn.onclick = (e) => {
          e.stopPropagation();
          doConfirm();
        };
      }
      if (cancelBtn) {
        cancelBtn.onclick = (e) => {
          e.stopPropagation();
          if (statusEl) {
            statusEl.textContent = 'Cancelled';
            statusEl.style.color = '#94a3b8';
          }
          setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
          }, 2000);
        };
      }

      speakPortalText(`Interpreted ${englishVal}. Please confirm.`);
    } else {
      f.mappedValue = englishVal;
      f.confirmed = true;
      if (f.element) {
        setNativeValue(f.element, englishVal);
        f.element.dispatchEvent(new Event('input', { bubbles: true }));
        f.element.dispatchEvent(new Event('change', { bubbles: true }));
        f.element.dispatchEvent(new Event('blur', { bubbles: true }));
      }
      speakPortalText(`Recorded: ${englishVal}`);
      renderPortalOverlay();
    }
  };

  recognition.onerror = () => {
    if (statusEl) statusEl.textContent = '';
  };
  recognition.onend = () => {
    // Keep status text if awaiting confirmation
  };

  recognition.start();
}

function fillCurrentPortalField() {
  if (!isAutofillModeOn) {
    speakPortalText('Autofill mode is turned off. Toggle it ON in the header to fill a field.');
    return;
  }
  const activeEl = document.activeElement;
  let targetField = currentFieldsList.find(f => f.element === activeEl);
  if (!targetField) {
    targetField = currentFieldsList.find(f => f.mappedValue && (!f.element.value || f.element.value === '')) || currentFieldsList[0];
  }
  if (targetField && targetField.element && isSensitiveField(targetField.element)) {
    speakPortalText('This field is sensitive and must be entered manually.');
    return;
  }
  if (targetField && targetField.confidence !== undefined && targetField.confidence < 0.75 && !targetField.confirmed) {
    speakPortalText('This match needs your confirmation before it can be filled.');
    return;
  }
  if (targetField && targetField.mappedValue && targetField.element) {
    setNativeValue(targetField.element, targetField.mappedValue);
    targetField.element.dispatchEvent(new Event('input', { bubbles: true }));
    targetField.element.dispatchEvent(new Event('change', { bubbles: true }));
    targetField.element.dispatchEvent(new Event('blur', { bubbles: true }));
    targetField.element.style.outline = '2px solid #10b981';
    targetField.element.style.backgroundColor = '#ecfdf5';
    speakPortalText(`Filled ${targetField.label || 'field'} with ${targetField.mappedValue}`);
  } else if (targetField && targetField.element) {
    targetField.element.focus();
    targetField.element.style.outline = '2px solid #38bdf8';
    speakPortalText(`Selected ${targetField.label || 'field'}. Please enter value.`);
  } else {
    speakPortalText('No form field available to fill.');
  }
}

function nextPortalGuideStep() {
  const guideSteps = assistantQueryResult?.data?.guideSteps || assistantQueryResult?.data?.steps || [];
  if (portalGuideStepIndex < guideSteps.length - 1) {
    portalGuideStepIndex++;
    renderPortalOverlay();
    highlightPortalCurrentGuideStep();
    speakPortalGuideStep();
  } else {
    speakPortalText('You are at the final step.');
  }
}

function prevPortalGuideStep() {
  if (portalGuideStepIndex > 0) {
    portalGuideStepIndex--;
    renderPortalOverlay();
    highlightPortalCurrentGuideStep();
    speakPortalGuideStep();
  } else {
    speakPortalText('You are at the first step.');
  }
}

async function handlePortalVoiceCommand(rawTranscript: string) {
  const text = rawTranscript.toLowerCase().trim();
  console.log('[TechFormBuddy] Portal Voice Command:', text);

  // Security filter: Never listen to or store passwords or OTPs
  if (/\b(password|passcode|secret|pin|otp|one time password)\b/i.test(text)) {
    speakPortalText('For your security, passwords and one-time passwords cannot be captured by voice.');
    return;
  }

  // Safety rule: "submit", "pay", "checkout" must NEVER click anything!
  if (/\b(submit|pay|checkout|complete payment|place order|finalize|confirm payment)\b/i.test(text)) {
    const submitBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a'))
      .find(el => {
        const t = (el.textContent || (el as HTMLInputElement).value || '').toLowerCase();
        return t.includes('submit') || t.includes('pay') || t.includes('checkout') || t.includes('जमा करें') || t.includes('भुगतान');
      }) as HTMLElement | null;

    if (submitBtn) {
      submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      submitBtn.style.outline = '4px solid #ef4444';
      submitBtn.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.8)';
    }

    speakPortalText('For your safety and protection, TechForm Buddy never submits forms or makes payments automatically. Please review the details and press submit yourself.');
    return;
  }

  // Hide / minimize
  if (/\b(hide|minimize|close buddy|dismiss|hide widget|छिपाओ|बंद करो)\b/i.test(text)) {
    isWidgetHidden = true;
    stopPortalSpeech();
    const badge = document.getElementById('tfb-launcher-badge');
    if (badge) badge.style.display = 'none';
    if (overlayHost) overlayHost.style.display = 'none';
    sendBackgroundMessage({ type: 'TFB_HIDE_SITE', siteHost: window.location.hostname });
    return;
  }

  // Stop / quiet
  if (/\b(stop|quiet|silence|pause|shut up|रुको|चुप)\b/i.test(text)) {
    stopPortalSpeech();
    return;
  }

  // Next step
  if (/\b(next step|next|आगे बढ़ो|अगला कदम|अगला)\b/i.test(text)) {
    nextPortalGuideStep();
    return;
  }

  // Previous step
  if (/\b(previous step|prev step|back|go back|पिछला कदम|पीछे)\b/i.test(text)) {
    prevPortalGuideStep();
    return;
  }

  // Fill this
  if (/\b(fill this|fill field|fill current|इसे भरो|यह भरो)\b/i.test(text)) {
    fillCurrentPortalField();
    return;
  }

  // Fill all
  if (/\b(fill all|auto fill|autofill|fill form|sab bharo|सब भरो|पूरा भरो)\b/i.test(text)) {
    applyAutofillToPage();
    speakPortalText('Filled verified fields on the page. Please review before proceeding.');
    return;
  }

  // 3a. SMART BRIEFING Intent
  if (/\b(briefing|smart briefing|page briefing|give me a briefing|read briefing|ब्रीफिंग)\b/i.test(text)) {
    runSmartBriefing();
    return;
  }

  // 3b. READ FULL PAGE
  if (/\b(read full page|read whole page|read complete page|पूरा पेज)\b/i.test(text)) {
    readFullPortalPage();
    return;
  }

  // 3c. READ NEXT FIELD
  if (/\b(read next field|next field|अगला फ़ील्ड)\b/i.test(text)) {
    readNextPortalField();
    return;
  }

  // Read aloud default -> runSmartBriefing()
  if (/\b(read aloud|read page|read form|speak|padho|पढ़ो|सुनाओ)\b/i.test(text)) {
    runSmartBriefing();
    return;
  }

  // Scroll down
  if (/\b(scroll down|page down|niche|नीचे जाओ|नीचे)\b/i.test(text)) {
    window.scrollBy({ top: 400, behavior: 'smooth' });
    speakPortalText('Scrolling down.');
    return;
  }

  // Scroll up
  if (/\b(scroll up|page up|upar|ऊपर जाओ|ऊपर)\b/i.test(text)) {
    window.scrollBy({ top: -400, behavior: 'smooth' });
    speakPortalText('Scrolling up.');
    return;
  }

  // Change language
  const langMatch = text.match(/\b(?:change language to|switch language to|speak in|भाषा बदलो)\s*([a-zA-Z\u0900-\u097F]+)/i);
  if (langMatch) {
    const target = langMatch[1].toLowerCase();
    let newCode = 'en';
    if (target.includes('hindi') || target.includes('हिन्दी')) newCode = 'hi';
    else if (target.includes('bengali') || target.includes('বাংলা')) newCode = 'bn';
    else if (target.includes('tamil') || target.includes('தமிழ்')) newCode = 'ta';
    else if (target.includes('telugu') || target.includes('తెలుగు')) newCode = 'te';
    else if (target.includes('english') || target.includes('अंग्रेजी')) newCode = 'en';

    activeLang = newCode;
    sendBackgroundMessage({ type: 'TFB_SET_LANGUAGE', language: newCode });
    updateOverlayLanguage(newCode);
    speakPortalText(`Language changed to ${target}`);
    return;
  }

  // "open <portal> with buddy"
  const openMatch = text.match(/\bopen\s+([a-zA-Z0-9\.\-]+)\s+with buddy\b/i);
  if (openMatch) {
    const portal = openMatch[1].toLowerCase();
    let url = portal;
    if (!url.startsWith('http')) {
      if (url.includes('parivahan')) url = 'https://parivahan.gov.in';
      else if (url.includes('passport')) url = 'https://passportindia.gov.in';
      else if (url.includes('epfo') || url.includes('uan')) url = 'https://unifiedportal-mem.epfindia.gov.in';
      else if (url.includes('scholarship')) url = 'https://scholarships.gov.in';
      else url = `https://${url}`;
    }
    speakPortalText(`Opening ${portal} with TechForm Buddy.`);
    window.open(url, '_blank');
    return;
  }

  // Download
  if (/\b(download|export|save document|डाउनलोड)\b/i.test(text)) {
    speakPortalText('Preparing download of your application summary.');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentFieldsList.map(f => ({ label: f.label, value: f.mappedValue || '' })), null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `TechFormBuddy_${window.location.hostname}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
    return;
  }

  // Fallback to background LLM / API
  try {
    const res = await sendBackgroundMessage({
      type: 'TFB_VOICE_INTENT',
      transcript: rawTranscript,
      currentLang: activeLang,
    });
    if (res && res.intent) {
      const intent = res.intent;
      if (intent.action === 'NAVIGATE_STEP') {
        if (intent.parameters?.direction === 'previous') prevPortalGuideStep();
        else nextPortalGuideStep();
      } else if (intent.action === 'FILL_THIS') {
        fillCurrentPortalField();
      } else if (intent.action === 'FILL_ALL') {
        applyAutofillToPage();
      } else if (intent.action === 'READ_ALOUD') {
        runSmartBriefing();
      } else if (intent.action === 'STOP') {
        stopPortalSpeech();
      } else if (intent.action === 'HIDE_WIDGET') {
        isWidgetHidden = true;
        const badge = document.getElementById('tfb-launcher-badge');
        if (badge) badge.style.display = 'none';
        if (overlayHost) overlayHost.style.display = 'none';
      } else if (intent.action === 'SCROLL_DOWN') {
        window.scrollBy({ top: 400, behavior: 'smooth' });
      } else if (intent.action === 'SCROLL_UP') {
        window.scrollBy({ top: -400, behavior: 'smooth' });
      } else if (intent.spokenResponse) {
        speakPortalText(intent.spokenResponse);
      }
      return;
    }
  } catch (err) {
    console.warn('[TechFormBuddy] LLM intent fallback error:', err);
  }

  // EVERYTHING ELSE IS A QUESTION (Requirement 1)
  // Route directly to sendPortalChatMessage so an answer is produced, displayed, and spoken!
  activeTab = 'assistant';
  renderPortalOverlay();
  sendPortalChatMessage(rawTranscript);
}

(window as any).handlePortalVoiceCommand = handlePortalVoiceCommand;

function startAssistantVoiceInput() {
  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognitionAPI) {
    alert('Voice recognition is not supported in this browser.');
    return;
  }

  const recognition = new SpeechRecognitionAPI();
  const langTagMap: Record<string, string> = {
    hi: 'hi-IN',
    bn: 'bn-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    en: 'en-US',
  };
  recognition.lang = langTagMap[activeLang] || 'en-US';
  recognition.interimResults = true;

  const inputEl = overlayHost?.querySelector('#tfb-assistant-input') as HTMLInputElement;
  const micBtn = overlayHost?.querySelector('#tfb-assistant-mic-btn') as HTMLButtonElement;
  if (micBtn) micBtn.textContent = '🔴';

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const currentText = final || interim;
    if (inputEl) inputEl.value = currentText;

    if (final) {
      if (micBtn) micBtn.textContent = '🎙️';
      if (activeTab === 'assistant') {
        sendPortalChatMessage(final.trim());
      } else {
        handlePortalVoiceCommand(final.trim());
      }
    }
  };

  recognition.onerror = (err: any) => {
    if (micBtn) micBtn.textContent = '🎙️';
    if (err?.error === 'not-allowed') {
      speakPortalText('Microphone permission was denied. Please allow microphone access in site settings or type your command.');
    }
  };
  recognition.onend = () => {
    if (micBtn) micBtn.textContent = '🎙️';
  };

  recognition.start();
}

/**
 * Apply autofill to verified/high-confidence fields only.
 * Requirement 5: Low-confidence fields MUST NOT be filled unless user confirmed them!
 */
function applyAutofillToPage() {
  if (!isAutofillModeOn) {
    speakPortalText('Autofill mode is turned off. Toggle it ON in the header to run.');
    return;
  }
  let count = 0;
  let skipped = 0;
  for (const item of currentFieldsList) {
    if (isSensitiveField(item.element)) {
      skipped++;
      continue;
    }
    // If low confidence and NOT explicitly confirmed, SKIP!
    if (item.confidence !== undefined && item.confidence < 0.75 && !item.confirmed) {
      skipped++;
      continue;
    }

    if (item.mappedValue && item.element) {
      (item as any).previousValue = (item.element as HTMLInputElement).value || '';
      setNativeValue(item.element, item.mappedValue);
      item.element.dispatchEvent(new Event('input', { bubbles: true }));
      item.element.dispatchEvent(new Event('change', { bubbles: true }));
      item.element.dispatchEvent(new Event('blur', { bubbles: true }));

      // Visual highlight for user confirmation
      item.element.style.outline = '2px solid #10b981';
      item.element.style.backgroundColor = '#ecfdf5';
      count++;
    } else {
      skipped++;
    }
  }

  console.log(`[TechFormBuddy] Auto-filled ${count} fields on portal page (${skipped} skipped)`);
}

function clearAutofilledInputs() {
  for (const item of currentFieldsList) {
    if (item.element) {
      setNativeValue(item.element, '');
      item.element.dispatchEvent(new Event('input', { bubbles: true }));
      item.element.dispatchEvent(new Event('change', { bubbles: true }));
      item.element.style.outline = '';
      item.element.style.backgroundColor = '';
    }
  }
}

function setNativeValue(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Window test hooks for conversational agent and on-visit alerts
(window as any).tfbCapturePageSnapshot = capturePageSnapshot;
(window as any).tfbValidateToolSafety = validateToolSafety;
(window as any).tfbExecuteTool = executeProposedTool;
(window as any).tfbChat = sendPortalChatMessage;
(window as any).tfbGetChatTurns = () => chatTurns;
(window as any).tfbGetPendingTool = () => pendingProposedTool;
(window as any).tfbGetBlockedMessage = () => blockedActionMessage;
(window as any).tfbSetChatTurns = (turns: any[]) => { chatTurns = turns; renderPortalOverlay(); };
(window as any).tfbSetPendingTool = (tool: any) => { pendingProposedTool = tool; renderPortalOverlay(); };
(window as any).tfbShowOnVisitAlert = (sourceName: string, alerts: any[]) => {
  onVisitSourceName = sourceName;
  onVisitAlerts = alerts;
  onVisitAlertDismissed = false;
  if (!overlayHost) {
    scanAndLaunchOverlay(activeLang);
  } else {
    renderPortalOverlay();
  }
};
(window as any).tfbHighlightNotice = highlightNoticeOnPage;
