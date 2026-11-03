# Chrome Extension Verification & Testing Checklist

This document details the step-by-step procedures to verify all functionality, safety guarantees, and edge cases of the TechForm Buddy Chrome Extension (Phase 4).

---

## 🧪 1. Automated Test Suite (Playwright)

Run the full end-to-end and unit test suite:
```bash
npm run test:form-core
```
**Expected Outcome**: All 39 tests pass across:
- **Phase 1**: Form extraction, analyzing layer, sensitive detection, date handling, bridge abstractions.
- **Phase 2**: Shadow DOM overlay, minimize/expand floating pill, 11 Indian regional languages, sensitive field skip.
- **Phase 3 & 3.5**: Backend LLM mapping, prompt injection defense, schema validation, rate limiting, log redaction, `/api/health?deep=1`.
- **Phase 4**: Scoped Bearer token auth, token hashing, revocation, expiry, route restrictions, Manifest V3 bundle verification, Hard Rule 2 (no submit events), and React synthetic state synchronization in ISOLATED world.

To run the live Gemini LLM integration test:
```powershell
$env:RUN_LIVE_LLM="true"; npx playwright test packages/form-core/test/phase3-endpoints.spec.ts -g "Live Gemini Integration" --config=packages/form-core/playwright.config.ts
```

---

## 📋 2. Manual Testing Checklist

Ensure the development server is active:
```bash
npm run dev
```

### Test Case A: Plain HTML Form (`plain-form.html`)
1. Open Chrome/Edge and load the unpacked extension from `packages/extension/dist`.
2. Connect the extension via `http://localhost:3000/extension/connect`.
3. Open `packages/form-core/test/pages/plain-form.html` in a tab (`http://localhost:3000/test-pages/plain-form.html` or direct file path).
4. Click the extension toolbar icon, then click **Start on this page**.
5. **Verify**:
   - The TechForm Buddy floating overlay appears on the right edge.
   - Stepper highlights the first field.
   - "Fill this field" fills the corresponding input.
   - "Fill all" completes all non-sensitive fields.
   - Clicking the minimize button (➖) collapses the overlay into a small floating pill.
   - Clicking the floating pill expands the overlay back to full view.
   - **Crucial**: Submit button is NOT clicked, form is NOT submitted.

---

### Test Case B: Controlled React Form (`react-form.html`)
1. Open `packages/form-core/test/pages/react-form.html`.
2. Notice the live state preview box at the bottom displaying `Current React State`.
3. Click the extension popup and select **Start on this page**.
4. Click "Fill all" or step through the inputs.
5. **Verify**:
   - Controlled React state updates in real-time in the preview box (Devika Sharma, email, occupation, agree).
   - React validation triggers properly without requiring user re-typing.

---

### Test Case C: Multi-Step / Tabbed Form (`multistep-form.html`)
1. Open `packages/form-core/test/pages/multistep-form.html`.
2. Launch the extension on Step 1.
3. Fill fields on Step 1, then click "Next" to advance to Step 2.
4. **Verify**:
   - `FormChangeObserver` automatically re-analyzes DOM mutations when the tab/step switches.
   - Overlay updates its field count and step guidance for Step 2 fields without breaking.

---

### Test Case D: Sensitive & Manual Fields (`sensitive-test.html`)
1. Open `packages/form-core/test/pages/sensitive-test.html`.
2. The page contains:
   - False-positive words: "Company Name", "Expand Services", "Panel Discussion", "Japan Branch".
   - True-positive sensitive words: "Aadhaar Number", "PAN Card", "Passport Number", "Bank Account", "OTP".
3. Launch the assistant and click **Fill all**.
4. **Verify**:
   - False-positive fields (Company, Expand, Panel, Japan) are treated as regular fields and filled if matching keys exist.
   - True-positive fields (Aadhaar, PAN, Passport, Bank, OTP) are strictly marked manual/ignored.
   - "Fill all" skips every sensitive field.
   - Sensitive inputs remain empty with guidance indicating: *"Please type this yourself"*.

---

### Test Case E: Multi-Language Switching & Text-to-Speech
1. Open the extension popup or the overlay header dropdown.
2. Switch language between English, Hindi (`हिन्दी`), Marathi (`मराठी`), Bengali (`বাংলা`), Tamil (`தமிழ்`), Telugu (`తెలుగు`), Gujarati (`ગુજરાતી`), Kannada (`ಕನ್ನಡ`), Malayalam (`മലയാളം`), Punjabi (`ਪੰਜਾਬੀ`), and Assamese (`অসমীয়া`).
3. **Verify**:
   - All UI labels, stepper instructions, button texts, and sensitive field notices instantly translate into the selected language.
   - Click the "Read aloud" (speaker) button on any step.
   - Verify speech synthesis plays or displays a clear message if the language voice pack is not installed on the system.

---

### Test Case F: Disconnect & Ephemeral Storage Cleanup
1. In the extension popup, click **Disconnect and clear data**.
2. **Verify**:
   - Connection status badge returns to "Disconnected" (Red).
   - "Start on this page" button disables.
   - `chrome.storage.local` token is deleted.
   - `chrome.storage.session` profile cache is completely purged.
3. In the web app at `http://localhost:3000/settings`:
   - Under "Connected Chrome Extensions", click **Revoke** for any active token.
   - Verify subsequent requests using that token fail with `401 Unauthorized` (`TOKEN_REVOKED`).
