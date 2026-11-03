# TechForm Buddy 🇮🇳

An accessible, privacy-first AI form assistance system designed to help users navigate and fill complex web forms on desktop and mobile browsers.

---

## 🔒 Hard Rules & Security Architecture

1. **No Iframes or Proxies**: External websites are never embedded inside iframes or proxied through our servers. Forms are filled in a real browser tab (desktop) or native WebView (mobile).
2. **Never Auto-Submit**: The extension and overlay will never click Submit, Pay, or Confirm buttons. The user always reviews everything and clicks Submit themselves.
3. **No Credential Access**: Passwords, OTPs, captchas, and hidden fields are completely ignored and never read, filled, or logged.
4. **Zero Government ID / Financial Storage**: TechForm Buddy never stores, autofills, or logs Aadhaar, PAN, Passport, Voter ID, or bank account / card numbers. When requested on official websites, the assistant prompts: *"Please type this yourself."*
5. **No Profile Values Sent to AI**: Form values and personal user data are **NEVER** sent to the LLM. Only field schema definitions (`label`, `type`, `options`, `required`, `section`) and profile key names are analyzed.
6. **No Speculative Guessing**: Mappings with confidence below 0.70 are left blank to prevent incorrect submissions.

---

## 🚀 Getting Started & Local Setup

### 1. Configure Environment Variables

Create a `.env.local` file in the project root (this file is gitignored):

```bash
# Google Gemini API Key for server-side form field mapping
GEMINI_API_KEY="your-gemini-api-key-here"

# NextAuth Authentication Configuration
NEXTAUTH_SECRET="your-development-or-production-secret"
NEXTAUTH_URL="http://localhost:3000"

# (Optional) Chrome Extension Origin for CORS
# Default allows localhost and chrome-extension:// origins
ALLOWED_EXTENSION_ORIGIN="*"
```

### 2. Install Dependencies

```bash
npm install
```

Install the Playwright Chromium browser before running the browser-driven test suite:

```bash
npx playwright install chromium
```

### 3. Build Form Core Engine (IIFE Bundle)

Build the browser injection core bundle:

```bash
npm run build:form-core
```

### 4. Run Next.js Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the full end-to-end Playwright test suite (including DOM scanning, overlay interactions, sensitive field boundary testing, minimize/expand, regional languages, and Phase 3 API endpoints):

```bash
npm run test:form-core
```

---

## 📡 Backend API Endpoints (Phase 3)

### `GET /api/health`
Service health check and configuration verification.
- **Response**: `{ status: 'ok', uptimeSeconds: number, geminiConfigured: boolean, timestamp: string }`

### `POST /api/form/map`
Server-side semantic form field mapping using the configured Gemini model (default: `gemini-3.1-flash-lite`) behind a swappable `LLMProvider` interface.
- **Authentication**: Requires authenticated session.
- **Payload**:
  ```json
  {
    "siteHost": "upsc.gov.in",
    "language": "en",
    "fields": [
      { "id": "f_name", "label": "Full Legal Name", "type": "text", "required": true }
    ],
    "profileKeys": ["full_name", "email", "phone"]
  }
  ```
- **Security & Defenses**:
  - `siteHost` is restricted to valid hostnames only (no protocol, path, query, or slashes).
  - Field labels and options are treated as untrusted text, truncated to sane lengths, stripped of control characters, and enclosed in delimited XML blocks.
  - Prompt injection defense: instructions inside field labels are ignored.
  - Output validated via Zod schema; confidence < 0.7 sets `profileKey` to `null`.
  - Cache by `siteHost + field-signature SHA-256 hash + language + allowed profile-key set`.
  - Per-user rate limiting (30 requests/min) and 250KB payload size limit.
  - Fallback error code (`LLM_UNAVAILABLE`, `fallbackToLocal: true`) on timeout or provider failure.

### `GET /api/profile/fill-values`
Retrieves non-sensitive, whitelisted profile attributes for the authenticated user to populate the client overlay.
- **Authentication**: Requires authenticated session.
- **Cache-Control**: `no-store, no-cache, must-revalidate`.
- **Logs**: Values are strictly redacted and never logged.

---

## 🌐 Phase 5: Portal Launcher & Demo Portal Architecture

### 1. Portal Launcher (`/browser`)
Replaced the experimental in-app browser with a secure **Portal Launcher**:
- **Zero Iframe Policy**: Real external department and government sites are NEVER embedded in iframes or proxied. All real portals open directly in an isolated new browser tab (`target="_blank"`, `rel="noopener noreferrer"`).
- **Domain Verification Badges**:
  - Hosts ending in `.gov.in` or `.nic.in` are flagged with: `🛡️ Official-looking domain`.
  - All other domains display an advisory warning: `⚠️ Check this is the official site before entering any details.`
- **Extension Handshake & Detection**:
  - Dynamically reads `document.documentElement.dataset.tfbExtension`.
  - Uninstalled state presents setup instructions (load unpacked) and a link to `/extension/connect`.
  - Installed state presents a quick "Connect" button. The isolated extension content script obtains and stores the scoped token; the page receives only a token-free success/failure response.
- **"Open with Buddy" Workflow**:
  - Launches the external portal in a new tab.
  - Presents an in-app 3-step security guide:
    1. **Log in to the portal yourself** (using your official credentials on the real portal; Buddy never asks for passwords or OTPs).
    2. **Click the Buddy icon in the toolbar**.
    3. **Press "Start on this page"** to analyze and assist with form filling.
- **Mandatory Safety Guarantee**:
  > *"Buddy fills the form on the real website. You review and press Submit yourself."*

### 2. TechForm Demo Portal (`/demo-portal`)
Isolated sandbox practice environment where users can test form filling, profile auto-fill, and voice recognition:
- **Permanent Disclaimer Banner**: *"Demo form only. Not a government website. Data is not sent to any department."*
- **Action Button**: Renamed from simulated submission to `"Submit (demo only)"`.
- **Strict Brand Separation**: All government seals, logos, "Official e-Governance Gateway", and "256-Bit SSL Encrypted" replicas have been completely removed.

### Document Vault status
- Uploaded files are encrypted and stored, with filename-only classification.
- **OCR/content extraction and automatic profile synchronization are not implemented.** The app must not claim a file was verified or extracted until a real extraction pipeline and review step are added.

### 3. Real Portal Search API (`GET /api/portal-search?q=...`)
- Queries Google Gemini with Google Search grounding or gracefully falls back to the live search adapter and curated index.
- Returns `{ title, url, host, description, isOfficialDomain }`.

### 4. Authentic Application Paper Download (`downloadFormAsDocument`)
- Replaces generic/blank table exports with high-fidelity, printable application paper formatting.
- Includes official application reference number, passport photograph placement box, formatted filled values in bold print typography, applicant declaration undertaking, and signature line.
- For formal letters, formats sender, date, recipient, subject, salutation, body paragraphs, and sign-off blocks.

### 5. Multilingual Input Translation
- Accepts form input typed or spoken in any Indic or foreign language.
- Automatically translates non-English responses to English upon field blur (`onBlur`).
- Provides individual field translation buttons (`🌐`) and a global `"Convert All to English"` action.
- Translation requests are sent to Google Translate; common structured identifiers, email addresses, and Indian mobile numbers are masked, but names and free-form personal details may not be. Avoid translating sensitive information.

