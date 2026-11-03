import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { VERIFIED_KNOWLEDGE_BASE, translateText } from '../route';
import { redactPII, containsPromptInjection } from '@/lib/piiSanitizer';

export interface PageSnapshot {
  title?: string;
  url?: string;
  headings?: string[];
  visibleText?: string;
  formFields?: Array<{
    id: string;
    name?: string;
    label: string;
    type: string;
    autocomplete?: string;
    required: boolean;
    isEmpty: boolean;
  }>;
  buttons?: string[];
  links?: Array<{ text: string; url: string }>;
  fileDownloads?: Array<{ text: string; url: string }>;
}

const GENERIC_ASSISTANT_KNOWLEDGE = {
  id: 'general-guidance',
  domain: 'general',
  keywords: [],
  title: 'General form guidance',
  summary: 'I do not have verified, page-specific guidance for this request. Check the official portal instructions before entering information.',
  steps: [],
  documentsNeeded: [],
  formCategory: 'general',
  formFields: [],
  portalUrl: '',
};

function keywordMatches(text: string, keyword: string): boolean {
  const normalizedText = text.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase().trim();
  if (!normalizedKeyword) return false;
  if (normalizedKeyword.length > 4 || normalizedKeyword.includes(' ')) {
    return normalizedText.includes(normalizedKeyword);
  }
  const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapedKeyword}($|[^a-z0-9])`, 'i').test(normalizedText);
}

export interface ProposedAction {
  name: string;
  parameters: Record<string, any>;
  confirmationPrompt?: string;
  isReadOnly?: boolean;
}

export interface ProposedTool {
  name: 'read_snapshot' | 'highlight' | 'fill' | 'scroll_to' | 'click' | 'navigate' | 'download' | 'speak';
  args: Record<string, any>;
  description: string;
  requiresConfirmation: boolean;
  isExternalDomain?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProfileMatch {
  key: string;
  value: string;
  source: 'profile' | 'document' | 'manual';
}

/**
 * Protect proper nouns, IDs, amounts, and dates during language translation
 */
export function protectTokens(text: string): { protectedText: string; tokens: Record<string, string> } {
  const tokens: Record<string, string> = {};
  let counter = 0;

  const dateRegex = /\b\d{1,4}[-/](?:\d{1,2}|[A-Za-z]{3,9})[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}\b/gi;
  const amountRegex = /(?:₹|Rs\.?|\$)\s*\d+(?:,\d+)*(?:\.\d+)?/gi;
  const properNounRegex = /\b(TechForm\s+Buddy|MPPSC|UPSC|SSC|Aadhaar|PAN|[A-Z]{3,}-[A-Z0-9-]+)\b/g;

  let protectedText = text.replace(dateRegex, (match) => {
    const key = `__TKN_DATE_${counter++}__`;
    tokens[key] = match;
    return key;
  });

  protectedText = protectedText.replace(amountRegex, (match) => {
    const key = `__TKN_AMT_${counter++}__`;
    tokens[key] = match;
    return key;
  });

  protectedText = protectedText.replace(properNounRegex, (match) => {
    const key = `__TKN_NOUN_${counter++}__`;
    tokens[key] = match;
    return key;
  });

  return { protectedText, tokens };
}

export function restoreTokens(text: string, tokens: Record<string, string>): string {
  let result = text;
  for (const [key, val] of Object.entries(tokens)) {
    result = result.replaceAll(key, val);
  }
  return result;
}

async function translateWithoutProfileValues(
  text: string,
  language: string,
  profileValues: Record<string, unknown>
): Promise<string> {
  const protectedValues = [...new Set(Object.values(profileValues)
    .filter((value): value is string | number => typeof value === 'string' || typeof value === 'number')
    .map(String)
    .filter(value => value.length > 0))].sort((a, b) => b.length - a.length);
  if (protectedValues.length === 0) return translateText(text, language);

  const output: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let matchIndex = -1;
    let matchedValue = '';
    for (const value of protectedValues) {
      const index = remaining.indexOf(value);
      if (index >= 0 && (matchIndex < 0 || index < matchIndex)) {
        matchIndex = index;
        matchedValue = value;
      }
    }
    if (matchIndex < 0) {
      output.push(await translateText(remaining, language));
      break;
    }
    if (matchIndex > 0) output.push(await translateText(remaining.slice(0, matchIndex), language));
    output.push(matchedValue);
    remaining = remaining.slice(matchIndex + matchedValue.length);
  }
  return output.join('');
}

/**
 * Generate 5-part spoken briefing per Requirement 3:
 * (a) what this page is,
 * (b) the ONE thing the user should do here,
 * (c) which parts are worth reading and which can be skipped (headers, menus, ads),
 * (d) the fields that must be filled and where each value comes from,
 * (e) warnings (deadline, required documents, fees).
 */
export function generate5PartBriefing(
  pageSnapshot: PageSnapshot,
  matchedKnowledge: any,
  availableFields: any[],
  findProfileValue: (label: string, type: string) => ProfileMatch
): string {
  const pageTitle = pageSnapshot.title || matchedKnowledge.title;
  const oneAction =
    availableFields.length > 0
      ? `complete the form by entering your ${availableFields[0].label}`
      : 'select a service or download the official guidelines';

  const skippableSections =
    'Skip the repetitive top navigation headers, side banner links, and footer disclaimers.';
  const readableSections =
    'Focus on the main form fields, eligibility criteria, and mandatory checklist.';

  let fieldsDescription = '';
  if (availableFields.length === 0) {
    fieldsDescription = 'There are no active editable form fields on this page.';
  } else {
    const fieldDetails = availableFields.slice(0, 4).map((f) => {
      const match = findProfileValue(f.label, f.type);
      const sourceName =
        match.source === 'profile'
          ? 'from your profile'
          : match.source === 'document'
          ? 'from your uploaded document'
          : 'you must type it';
      return `${f.label} (${sourceName})`;
    });
    fieldsDescription = `Required fields to fill: ${fieldDetails.join(', ')}.`;
  }

  const deadline = matchedKnowledge.deadline || 'not specified on this page';
  const fee = matchedKnowledge.applicationFee || 'not specified on this page';
  const documents = matchedKnowledge.documentsNeeded?.length
    ? matchedKnowledge.documentsNeeded.join(', ')
    : 'not specified on this page';
  const warnings = `Deadline: ${deadline}. Application fee: ${fee}. Required documents: ${documents}. Verify current details on the official notice.`;

  return [
    `(a) Page Summary: This page is ${pageTitle}. ${matchedKnowledge.summary}`,
    `(b) Priority Action: The ONE thing to do here is to ${oneAction}.`,
    `(c) Reading Guide: ${readableSections} ${skippableSections}`,
    `(d) Fields to Fill: ${fieldsDescription}`,
    `(e) Warnings: ${warnings}`,
  ].join('\n\n');
}

/**
 * Helper to extract language code from utterance
 */
function extractLanguageCode(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes('hindi') || t.includes('हिन्दी') || t.includes('हिंदी')) return 'hi';
  if (t.includes('english') || t.includes('अंग्रेजी')) return 'en';
  if (t.includes('bengali') || t.includes('bangla') || t.includes('বাংলা')) return 'bn';
  if (t.includes('telugu') || t.includes('తెలుగు')) return 'te';
  if (t.includes('tamil') || t.includes('தமிழ்')) return 'ta';
  if (t.includes('marathi') || t.includes('मराठी')) return 'mr';
  if (t.includes('gujarati') || t.includes('ગુજરાતી')) return 'gu';
  if (t.includes('kannada') || t.includes('ಕನ್ನಡ')) return 'kn';
  if (t.includes('malayalam') || t.includes('മലയാളം')) return 'ml';
  if (t.includes('punjabi') || t.includes('ਪੰਜਾਬੀ')) return 'pa';
  if (t.includes('odia') || t.includes('oriya') || t.includes('ଓଡ଼ିଆ')) return 'or';
  if (t.includes('assamese') || t.includes('অসমীয়া')) return 'as';
  if (t.includes('urdu') || t.includes('اردو')) return 'ur';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      currentPage = '/',
      availableActions = [],
      pageSnapshot = {} as PageSnapshot,
      language = 'en',
      profileValues = {},
      fieldIndex = 0,
      isBriefing = false,
    } = body;

    // Session context: enforce maximum last 10 turns
    const recentMessages: ChatMessage[] = Array.isArray(messages) ? messages.slice(-10) : [];
    const lastUserMessage = recentMessages.filter((m) => m.role === 'user').pop()?.content || '';
    const qLower = lastUserMessage.toLowerCase().trim();

    // 1. HARD SECURITY & PROMPT INJECTION GUARD (Requirement 6)
    const untrustedHeadings = (pageSnapshot.headings || []).join(' ');
    const untrustedVisible = pageSnapshot.visibleText || '';
    const untrustedTextProbe = `${lastUserMessage} ${pageSnapshot.title || ''} ${untrustedHeadings} ${untrustedVisible}`;

    if (containsPromptInjection(untrustedTextProbe)) {
      let safeMsg = 'Notice: Security boundaries are preserved. Untrusted instructions from page text or inputs are not executed.';
      if (language && language !== 'en') {
        safeMsg = await translateText(safeMsg, language);
      }
      return NextResponse.json({
        reply: safeMsg,
        proposedAction: null,
        proposedTool: null,
        language,
        securityBlocked: true,
      });
    }

    // Prefer a topic explicitly named by the user. Do not select a topic from
    // arbitrary body copy: generic pages can mention unrelated services.
    const queryMatches = VERIFIED_KNOWLEDGE_BASE
      .map((knowledge) => ({
        knowledge,
        score: knowledge.keywords.reduce((best, keyword) =>
          keywordMatches(qLower, keyword) ? Math.max(best, keyword.length) : best, 0),
      }))
      .filter((match) => match.score > 0)
      .sort((a, b) => b.score - a.score);

    const pageContextQuestion = /\b(this page|this form|on this page|what do i fill|what should i fill|documents|deadline|next step|what is happening|what is this page|what is this form|here)\b/i.test(qLower);
    const concisePageContext = [
      pageSnapshot.title || '',
      pageSnapshot.url || '',
      currentPage || '',
      ...(pageSnapshot.headings || []),
      ...(pageSnapshot.buttons || []),
      ...((pageSnapshot.links || []) as Array<{ text: string; url: string }>).map((link) => link.text),
    ].join(' ').toLowerCase();
    const pageMatches = pageContextQuestion
      ? VERIFIED_KNOWLEDGE_BASE
        .map((knowledge) => ({
          knowledge,
          score: knowledge.keywords.reduce((best, keyword) =>
            keywordMatches(concisePageContext, keyword) ? Math.max(best, keyword.length) : best, 0),
        }))
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score)
      : [];

    const matchedKnowledge = queryMatches[0]?.knowledge
      || pageMatches[0]?.knowledge
      || GENERIC_ASSISTANT_KNOWLEDGE;

    const pageSignals = [
      pageSnapshot.title || '',
      pageSnapshot.url || '',
      currentPage || '',
      ...(pageSnapshot.headings || []),
      ...(pageSnapshot.buttons || []),
      untrustedVisible,
    ].join(' ').toLowerCase();

    // Keep sensitive fields outside assistant suggestions; they must remain manual-only.
    const availableFields = (pageSnapshot.formFields || []).filter((f: any) => {
      const type = (f.type || '').toLowerCase();
      const metadata = `${f.id || ''} ${f.name || ''} ${f.label || ''} ${f.autocomplete || ''}`;
      return type !== 'password' && !/\b(password|passwd|otp|one-time-code|captcha|cvv|cvc|pin|passcode|aadhaar|aadhar|uidai|pan|passport|epic|voter\s*id|bank|account|credit\s*card|debit\s*card|ifsc|iban)\b/i.test(metadata);
    });

    // Profile match helper
    const findProfileValue = (fieldLabel: string, fieldType: string): ProfileMatch => {
      const fl = fieldLabel.toLowerCase();
      if (fl.includes('name') || fl.includes('applicant') || fl.includes('naam')) {
        const value = profileValues.fullName || profileValues.name || '';
        return {
          key: 'Full Name',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (fl.includes('email') || fieldType === 'email') {
        const value = profileValues.email || '';
        return {
          key: 'Email',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (fl.includes('mobile') || fl.includes('phone') || fl.includes('contact') || fieldType === 'tel') {
        const value = profileValues.phone || profileValues.mobile || '';
        return {
          key: 'Mobile Number',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (fl.includes('aadhaar') || fl.includes('uid')) {
        return {
          key: 'Aadhaar Number',
          value: '',
          source: 'manual',
        };
      }
      if (fl.includes('pan')) {
        return {
          key: 'PAN Card',
          value: '',
          source: 'manual',
        };
      }
      if (fl.includes('percentage') || fl.includes('10th') || fl.includes('marks')) {
        const value = profileValues.percentage || '';
        return {
          key: '10th Percentage',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (fl.includes('birth') || fl.includes('dob') || fieldType === 'date') {
        const value = profileValues.dob || '';
        return {
          key: 'Date of Birth',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (fl.includes('gender') || fl.includes('sex') || fl.includes('ling')) {
        const value = profileValues.gender || '';
        return {
          key: 'Gender',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (fl.includes('address') || fl.includes('pata') || fl.includes('residence')) {
        const value = profileValues.address || '';
        return {
          key: 'Residential Address',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (fl.includes('pincode') || fl.includes('postal') || fl.includes('pin')) {
        const value = profileValues.pincode || '';
        return {
          key: 'Pincode',
          value,
          source: value ? 'profile' : 'manual',
        };
      }
      if (typeof profileValues[fieldLabel] === 'string' && profileValues[fieldLabel].trim()) {
        return {
          key: fieldLabel,
          value: profileValues[fieldLabel],
          source: 'profile',
        };
      }
      return {
        key: fieldLabel,
        value: '',
        source: 'manual',
      };
    };

    let replyText = '';
    let proposedAction: ProposedAction | null = null;
    let proposedTool: ProposedTool | null = null;
    let isGuideMode = false;

    // Set of action names currently available in the registry for this page
    const registeredActionNames = new Set(
      Array.isArray(availableActions) ? availableActions.map((a: any) => a.name) : []
    );

    // ─────────────────────────────────────────────────────────────
    // 2. GUIDE MODE (Requirement 5)
    // ─────────────────────────────────────────────────────────────
    const isGuideRequest =
      qLower.includes('complete guide') ||
      qLower.includes('guide me') ||
      qLower.includes('explain page') ||
      qLower.includes('page guide') ||
      qLower.includes('pura guide') ||
      qLower.includes('poora guide') ||
      qLower.includes('how to use this page');

    if (isGuideRequest) {
      isGuideMode = true;
      if (currentPage.startsWith('/forms/new') || currentPage.startsWith('/forms/')) {
        replyText = [
          `Complete Guide for Form Editor:`,
          `(a) Purpose: Review and complete all required application sections for ${matchedKnowledge.title}.`,
          `(b) Ordered Steps:`,
          `1. Enter applicant personal details (Name, DOB, Mobile).`,
          `2. Fill education, address, and category details.`,
          `3. Attach verified supporting documents.`,
          `4. Review summary and download as PDF.`,
          `(c) Preparation: Please keep your Aadhaar, PAN card, and marks sheet ready.`,
          `(d) Next Step: Would you like me to fill the next unfilled field?`,
        ].join('\n\n');

        if (registeredActionNames.has('fill_field') && availableFields.length > 0) {
          const firstUnfilled = availableFields.find((f: any) => f.isEmpty) || availableFields[0];
          const match = findProfileValue(firstUnfilled.label, firstUnfilled.type);
          if (match.value) {
            proposedAction = {
              name: 'fill_field',
              parameters: { field: firstUnfilled.id, value: match.value },
              confirmationPrompt: `Fill field "${firstUnfilled.label}" with "${match.value}"?`,
            };
          }
        }
      } else if (currentPage.startsWith('/form-watch')) {
        replyText = [
          `Complete Guide for Form Watch:`,
          `(a) Purpose: Monitor official government portals for vacancy, admit card, and scholarship notifications.`,
          `(b) Ordered Steps:`,
          `1. Type an organization or exam name (e.g., MPPSC, UPSC, Scholarship).`,
          `2. Pick the official government source cards.`,
          `3. Select notice types (Recruitment, Admit Card, Result).`,
          `4. Save your watcher to receive background alerts.`,
          `(c) Preparation: Have your target exam names ready.`,
          `(d) Next Step: Would you like to create a watch for MPPSC now?`,
        ].join('\n\n');

        if (registeredActionNames.has('create_watch')) {
          proposedAction = {
            name: 'create_watch',
            parameters: { query: 'MPPSC' },
            confirmationPrompt: `Create a form watch for "MPPSC"?`,
          };
        }
      } else if (currentPage.startsWith('/settings')) {
        replyText = [
          `Complete Guide for Settings:`,
          `(a) Purpose: Customize accessibility, voice rate, and language preferences.`,
          `(b) Ordered Steps:`,
          `1. Choose your preferred native language.`,
          `2. Adjust text-to-speech reading speed.`,
          `3. Toggle high contrast or dyslexic font if required.`,
          `(c) Preparation: Select your comfort options.`,
          `(d) Next Step: Would you like to set your language to Hindi?`,
        ].join('\n\n');

        if (registeredActionNames.has('set_language')) {
          proposedAction = {
            name: 'set_language',
            parameters: { lang: 'hi' },
            confirmationPrompt: `Change application language to Hindi (हिन्दी)?`,
          };
        }
      } else {
        // Forms page or default
        replyText = [
          `Complete Guide for Citizen Forms:`,
          `(a) Purpose: Access, fill, and download official government citizen applications and schemes.`,
          `(b) Ordered Steps:`,
          `1. Choose a scheme or form category.`,
          `2. Fill in the required application details.`,
          `3. Review and attach documents.`,
          `4. Download the finalized PDF document.`,
          `(c) Preparation: Keep your identity proofs and academic documents ready.`,
          `(d) Next Step: Would you like to start a new form application?`,
        ].join('\n\n');

        if (registeredActionNames.has('start_new_form')) {
          proposedAction = {
            name: 'start_new_form',
            parameters: { type: 'scholarship' },
            confirmationPrompt: `Start a new Scholarship application form?`,
          };
        }
      }
    }
    // ─────────────────────────────────────────────────────────────
    // 3. ACTION MATCHING VIA ACTION REGISTRY
    // ─────────────────────────────────────────────────────────────
    // A. Change Language action (set_language)
    else if (
      qLower.includes('change language') ||
      qLower.includes('set language') ||
      qLower.includes('switch language') ||
      qLower.includes('language to') ||
      qLower.includes('bhasha badlo') ||
      qLower.includes('hindi me') ||
      qLower.includes('in hindi') ||
      qLower.includes('hindi karo')
    ) {
      const targetLang = extractLanguageCode(qLower) || 'hi';
      const langNames: Record<string, string> = {
        hi: 'Hindi (हिन्दी)',
        en: 'English',
        bn: 'Bengali (বাংলা)',
        te: 'Telugu (తెలుగు)',
        ta: 'Tamil (தமிழ்)',
        mr: 'Marathi (मराठी)',
        gu: 'Gujarati (ગુજરાતી)',
        kn: 'Kannada (ಕನ್ನಡ)',
        ml: 'Malayalam (മലയാളം)',
      };
      const displayName = langNames[targetLang] || targetLang.toUpperCase();

      replyText = `Do you want to change the application language to ${displayName}?`;
      proposedAction = {
        name: 'set_language',
        parameters: { lang: targetLang },
        confirmationPrompt: `Change application language to ${displayName}?`,
      };
    }
    // B. Download PDF action (download_pdf)
    else if (
      qLower.includes('download pdf') ||
      qLower.includes('download as pdf') ||
      qLower.includes('pdf download') ||
      qLower.includes('download form') ||
      qLower.includes('save as pdf') ||
      qLower === 'download'
    ) {
      replyText = `Do you want to download the application form as a PDF document?`;
      proposedAction = {
        name: 'download_pdf',
        parameters: { formId: 'current' },
        confirmationPrompt: `Download the application form as PDF?`,
      };
      proposedTool = {
        name: 'download',
        args: { url: '/api/forms/download', filename: 'form.pdf' },
        description: `Download application form as PDF?`,
        requiresConfirmation: true,
      };
    }
    // C. Navigate action (navigate)
    else if (
      qLower.startsWith('go to ') ||
      qLower.startsWith('navigate to ') ||
      qLower.startsWith('open page ') ||
      qLower.includes('go to forms') ||
      qLower.includes('open forms') ||
      qLower.includes('open dashboard') ||
      qLower.includes('open documents') ||
      qLower.includes('open watch') ||
      qLower.includes('open settings') ||
      qLower.includes('open profile')
    ) {
      let pageTarget = '/forms';
      if (qLower.includes('dashboard')) pageTarget = '/dashboard';
      else if (qLower.includes('documents') || qLower.includes('document')) pageTarget = '/documents';
      else if (qLower.includes('watch')) pageTarget = '/form-watch';
      else if (qLower.includes('settings')) pageTarget = '/settings';
      else if (qLower.includes('profile')) pageTarget = '/profile';
      else if (qLower.includes('home')) pageTarget = '/';

      replyText = `Navigating to ${pageTarget}...`;
      proposedAction = {
        name: 'navigate',
        parameters: { page: pageTarget },
        isReadOnly: true,
      };
    }
    // D. Start New Form action (start_new_form)
    else if (
      qLower.includes('start new form') ||
      qLower.includes('create new form') ||
      qLower.includes('new form') ||
      qLower.includes('naya form')
    ) {
      let formType = 'general';
      if (qLower.includes('scholarship')) formType = 'scholarship';
      else if (qLower.includes('job') || qLower.includes('recruitment')) formType = 'job';
      else if (qLower.includes('caste')) formType = 'caste_certificate';
      else if (qLower.includes('income')) formType = 'income_certificate';

      replyText = `Would you like me to start creating a new ${formType} application form?`;
      proposedAction = {
        name: 'start_new_form',
        parameters: { type: formType },
        confirmationPrompt: `Start creating a new ${formType} form?`,
      };
    }
    // E. Fill field action (fill_field)
    else if (
      qLower.startsWith('fill ') ||
      qLower.includes('what do i fill here') ||
      qLower.includes('what should i fill') ||
      qLower.includes('kahan kya bharna') ||
      qLower.includes('is field me kya') ||
      qLower.includes('ye field kya hai') ||
      qLower.includes('what is this field')
    ) {
      const targetField = availableFields[fieldIndex] || availableFields[0];
      if (targetField) {
        const match = findProfileValue(targetField.label, targetField.type);
        if (!match.value) {
          replyText = `No verified value for "${targetField.label}" is available in your profile. Please enter it yourself.`;
        } else {
          const sourceDesc = match.source === 'profile' ? `your profile (${match.key})` : 'a verified source';
          replyText = `Current Field: "${targetField.label}". The value comes from ${sourceDesc}. Would you like me to fill it?`;
          proposedAction = {
            name: 'fill_field',
            parameters: { field: targetField.id, value: match.value },
            confirmationPrompt: `Fill "${targetField.label}" with the value from your profile?`,
          };
          proposedTool = {
            name: 'fill',
            args: { field: targetField.id, fieldLabel: targetField.label, value: match.value },
            description: `Fill "${targetField.label}" with the value from your profile?`,
            requiresConfirmation: true,
          };
        }
      } else {
        replyText = `There are no open editable fields on this page.`;
      }
    }
    // F. Create watch action (create_watch)
    else if (qLower.includes('watch') || qLower.includes('monitor') || qLower.includes('alert')) {
      const queryWord = qLower.replace(/watch|create|monitor|alert|for/g, '').trim() || 'MPPSC';
      replyText = `Would you like me to create a form watch to monitor updates for "${queryWord}"?`;
      proposedAction = {
        name: 'create_watch',
        parameters: { query: queryWord },
        confirmationPrompt: `Create watch for "${queryWord}"?`,
      };
    }
    // G. Smart Briefing (read_aloud / SMART_BRIEFING)
    else if (
      isBriefing ||
      qLower.includes('briefing') ||
      qLower.includes('read briefing') ||
      qLower.includes('smart read') ||
      qLower.includes('smart briefing') ||
      qLower.includes('short spoken briefing')
    ) {
      replyText = generate5PartBriefing(pageSnapshot, matchedKnowledge, availableFields, findProfileValue);
      proposedAction = {
        name: 'read_aloud',
        parameters: { scope: 'briefing' },
        isReadOnly: true,
      };
    }
    // H. "what is happening on this page"
    else if (
      qLower.includes('what is happening on this page') ||
      qLower.includes('whats happening in this page') ||
      qLower.includes('what is happening in this page') ||
      qLower.includes('what is this page') ||
      qLower.includes('ye page kya hai') ||
      qLower.includes('ye form kis liye hai') ||
      qLower.includes('what is this form')
    ) {
      replyText = `This page is "${pageSnapshot.title || matchedKnowledge.title}". ${matchedKnowledge.summary} The primary action here is to ${availableFields.length > 0 ? 'fill out the required application fields' : 'select a service or notice'}.`;
    }
    // I. "which documents do I need"
    else if (
      qLower.includes('which documents do i need') ||
      qLower.includes('which documents') ||
      qLower.includes('kaunse documents') ||
      qLower.includes('what documents') ||
      qLower.includes('documents needed') ||
      qLower.includes('document checklist')
    ) {
      if (matchedKnowledge?.documentsNeeded && matchedKnowledge.documentsNeeded.length > 0) {
        const docList = matchedKnowledge.documentsNeeded.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n');
        replyText = `Documents required for ${matchedKnowledge.title}:\n${docList}`;
      } else {
        replyText = `Required documents are not specified on this page.`;
      }
    }
    // J. "what should I do next"
    else if (
      qLower.includes('what should i do next') ||
      qLower.includes('what to do next') ||
      qLower.includes('aage kya karun') ||
      qLower.includes('next step')
    ) {
      const nextUnfilled = availableFields.find((f: any) => f.isEmpty);
      if (nextUnfilled) {
        const match = findProfileValue(nextUnfilled.label, nextUnfilled.type);
        replyText = match.value
          ? `Your next step is to review the profile value available for "${nextUnfilled.label}".`
          : `Your next step is to enter "${nextUnfilled.label}" yourself; no profile value is available.`;
        proposedTool = {
          name: 'highlight',
          args: { element: nextUnfilled.id },
          description: `Highlight next required field: ${nextUnfilled.label}`,
          requiresConfirmation: false,
        };
      } else if (pageSnapshot.buttons && pageSnapshot.buttons.length > 0) {
        replyText = `All fields appear ready. Your next step is to click "${pageSnapshot.buttons[0]}" to proceed.`;
      } else {
        replyText = `Review your entered information before continuing.`;
      }
    }
    // K. "is the deadline over"
    else if (
      qLower.includes('is the deadline over') ||
      qLower.includes('deadline') ||
      qLower.includes('last date') ||
      qLower.includes('antim tithi') ||
      qLower.includes('aakhri date')
    ) {
      const text = `${pageSignals} ${untrustedVisible}`;
      const deadlineMatch = text.match(/\b(?:deadline|last date|closing date|valid till)[:\s]+([0-9a-zA-Z\s,/-]+)/i);
      if (deadlineMatch) {
        replyText = `The page mentions this deadline: ${deadlineMatch[1].trim()}. Check the official notice to confirm whether it is still current.`;
      } else if (matchedKnowledge?.processingTime) {
        replyText = `Processing time: ${matchedKnowledge.processingTime}. Specific closing deadline is not mentioned on this page.`;
      } else {
        replyText = `The deadline is not mentioned on this page. Please refer to the official notification bulletin.`;
      }
    }
    // L. Confirmation of proposed tool (haan, yes, fill it)
    else if (
      qLower === 'haan' ||
      qLower === 'yes' ||
      qLower === 'ok' ||
      qLower.includes('fill it') ||
      qLower.includes('bhar do')
    ) {
      const targetField = availableFields[fieldIndex] || availableFields[0];
      if (targetField) {
        const match = findProfileValue(targetField.label, targetField.type);
        if (!match.value) {
          replyText = `No verified value for "${targetField.label}" is available. Please enter it yourself.`;
        } else {
          replyText = `A value from your profile is available for "${targetField.label}". Shall I fill it?`;
          proposedAction = {
            name: 'fill_field',
            parameters: { field: targetField.id, value: match.value },
            confirmationPrompt: `Fill "${targetField.label}" with the value from your profile?`,
          };
          proposedTool = {
            name: 'fill',
            args: { field: targetField.id, fieldLabel: targetField.label, value: match.value },
            description: `Fill "${targetField.label}" with the value from your profile?`,
            requiresConfirmation: true,
          };
        }
      } else {
        replyText = `No form field is currently selected to fill.`;
      }
    }
    // M. UNKNOWN / GENERAL REQUEST (Requirement 2 & 7: Never echo command, answer honestly)
    else {
      const words = qLower.split(/\s+/).filter((w) => w.length > 3);
      const hasPageMatch = words.some((w) => pageSignals.includes(w));

      if (hasPageMatch) {
        replyText = `Based on this page ("${pageSnapshot.title || 'Citizen Portal'}"): ${matchedKnowledge.summary} You can ask me to navigate, fill fields, download PDF, or explain the page steps.`;
      } else {
        // Honest informative answer without echoing user command
        replyText = `I am your TechForm Buddy form assistant. I do not have specific information about that on this page. You can ask me to navigate, explain this page, fill form fields, download a PDF, or adjust your settings.`;
      }
    }

    // Always translate assistant reply into user's selected language,
    // preserving proper nouns, IDs, amounts, and dates.
    if (language && language !== 'en') {
      try {
        const { protectedText, tokens } = protectTokens(replyText);
        let translated = await translateWithoutProfileValues(protectedText, language, profileValues);
        replyText = restoreTokens(translated, tokens);

        if (proposedAction?.confirmationPrompt) {
          const pt = protectTokens(proposedAction.confirmationPrompt);
          const trPt = await translateWithoutProfileValues(pt.protectedText, language, profileValues);
          proposedAction.confirmationPrompt = restoreTokens(trPt, pt.tokens);
        }

        if (proposedTool?.description) {
          const pt = protectTokens(proposedTool.description);
          const trPt = await translateWithoutProfileValues(pt.protectedText, language, profileValues);
          proposedTool.description = restoreTokens(trPt, pt.tokens);
        }
      } catch (err) {
        console.warn('[Assistant Chat Route] Translation error:', err);
      }
    }

    return NextResponse.json({
      reply: replyText,
      proposedAction,
      proposedTool,
      language,
      isGuideMode,
      matchedTopic: matchedKnowledge.title,
    });
  } catch (error: any) {
    console.error('[Assistant Chat Route] Error:', error);
    return NextResponse.json(
      { error: 'CHAT_FAILED', message: error.message },
      { status: 500 }
    );
  }
}
