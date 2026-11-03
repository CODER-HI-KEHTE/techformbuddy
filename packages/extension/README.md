# TechForm Buddy Chrome Extension (Manifest V3)

TechForm Buddy Chrome Extension assists users in navigating, understanding, and filling complex Indian government and service web forms directly on real external websites without auto-submitting or compromising user privacy.

---

## 🛡️ Core Security Architecture & Hard Rules

1. **NEVER auto-submits**: Never triggers form `submit` events or clicks Submit, Pay, or Confirm buttons. The user always reviews and clicks Submit themselves.
2. **NEVER handles sensitive credentials**: Passwords, OTPs, captchas, Aadhaar, PAN, passports, and bank account numbers are NEVER autofilled, saved, or logged. Sensitive fields are highlighted with instructions prompting the user: *"Please type this yourself"*.
3. **Privacy-Preserving Form Mapping**: Profile values are NEVER sent to LLM backends or external servers. Only field metadata (schema, labels, names, input types) and the target hostname are transmitted.
4. **Scoped Ephemeral Storage**:
   - Connection tokens are stored in `chrome.storage.local`.
   - Fetched profile values exist **only** in `chrome.storage.session` (in-memory, cleared when the browser closes) and are explicitly purged whenever the overlay closes or disconnect is triggered.
5. **ISOLATED World Execution**:
   - The form-core injection (`form-core.iife.js`) executes in the Chrome Extension's **ISOLATED world**.
   - **Why ISOLATED world?**
     - **Security & Token Isolation**: Page scripts cannot access extension execution context, APIs (`chrome.*`), or injected tokens. Malicious third-party scripts on external websites cannot intercept tokens or modify form assistance callbacks.
     - **Framework Compatibility**: Synthetic event dispatching for React and modern SPA frameworks works seamlessly across the isolated boundary by invoking native prototype setters:
       ```javascript
       const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
       nativeSetter?.call(input, value);
       input.dispatchEvent(new Event('input', { bubbles: true }));
       ```
     - Validated and tested on `react-form.html` with real controlled React components.

---

## 📦 Directory Structure

```text
packages/extension/
├── dist/                      # Built extension ready to load unpacked
│   ├── manifest.json
│   ├── background.js          # Service worker
│   ├── content-app.js         # App detection content script
│   ├── form-core.iife.js      # Bundled core form assistant
│   ├── popup.html             # Extension popup UI
│   ├── popup.css              # Popup styling
│   ├── popup.js               # Popup logic
│   └── icons/                 # Extension icons
├── src/
│   ├── background.ts          # Service worker logic, LLM proxy, TTS
│   ├── content-app.ts         # App origin detection (document.documentElement.dataset.tfbExtension)
│   └── popup.ts               # Popup controls, language switcher, connection status
├── public/
│   ├── popup.html
│   └── popup.css
├── build.mjs                  # Bundler & asset copier
├── manifest.json              # Fixed RSA key Manifest V3
└── tsconfig.json
```

---

## 🚀 Build & Installation Guide

### 1. Build the Extension Bundle
From the repository root:
```bash
npm run build:extension
```
This compiles TypeScript files via `esbuild` and outputs everything to `packages/extension/dist/`.

### 2. Load Unpacked in Google Chrome / Microsoft Edge
1. Open Google Chrome or Microsoft Edge.
2. Navigate to `chrome://extensions/` (or `edge://extensions/`).
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked**.
5. Select the `packages/extension/dist` directory from this repository:
   `c:\Users\ACER\Desktop\techformbuddy\packages\extension\dist`
6. Verify that **TechForm Buddy Assistant** appears with ID: `fjlpjcmiflkpcbkmeopkcffopdojieph`.

---

## 🔗 Connect Flow

1. Start the TechForm Buddy web application:
   ```bash
   npm run dev
   ```
2. In your browser, log in to `http://localhost:3000`.
3. Open `http://localhost:3000/extension/connect`.
4. Click **Connect Extension**.
5. The web page issues an authorized token (`tfb_ext_...`) via `POST /api/extension/token` and sends it to the extension service worker via `chrome.runtime.sendMessage` (`externally_connectable`).
6. The extension saves the token in `chrome.storage.local`.
7. Click the TechForm Buddy extension icon in your browser toolbar to confirm:
   - Status badge shows: **Connected** (Green).
   - Language selector is available with 11 regional languages.
   - **Start on this page** button is enabled.

---

## ⚙️ How "Start on this page" Works

1. User navigates to any form page (e.g., government portal, test form).
2. User opens the popup and clicks **Start on this page**.
3. The extension service worker injects `form-core.iife.js` into the active tab via `chrome.scripting.executeScript`.
4. `readForm()` scans the DOM, identifying fields, labels, input types, and sensitive markers.
5. Field schemas and the target hostname are sent to the extension service worker.
6. The service worker calls `POST /api/form/map` using the scoped Bearer token.
   - If the LLM is unreachable or returns `LLM_UNAVAILABLE`, the extension falls back cleanly to the local rule-based `analyzeForm()`.
7. Profile values are fetched via `GET /api/profile/fill-values` with the token and stored in `chrome.storage.session`.
8. The values are handed to `overlay.setData()` inside the tab. Profile values are **never sent to external servers or logged**.
9. The Shadow DOM overlay renders on the page, showing step-by-step guidance in the user's preferred language.

---

## ⚠️ Known Limitations

1. **Cross-Origin Iframes**: Forms hosted inside `<iframe>` tags from a different domain cannot be accessed by content scripts due to browser origin boundaries.
2. **Closed Shadow Roots**: Elements attached with `{ mode: 'closed' }` shadow roots cannot be inspected by external DOM traversers.
3. **File Uploads (`<input type="file">`)**: Browser security blocks programmatic file assignment; users must select and upload documents manually.
4. **Custom Non-Standard Dropdown / Date Widgets**: Heavy JavaScript custom UI libraries (Canvas-based or deeply custom `<div>` dropdowns lacking ARIA standard roles) may not register standard input events.
