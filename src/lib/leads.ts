/**
 * Lead capture.
 *
 * There is a real tension here and it is worth naming rather than papering
 * over: the landing page promises "no account, nothing leaves your browser",
 * and that promise is the reason the free check builds trust at all. Putting
 * an email wall in front of it would trade the whole positioning for a
 * slightly bigger list.
 *
 * So the rule is: the free check stays ungated, always. Contact details are
 * asked for AFTER the answer has been given, as an offer rather than a toll —
 * "shall we email this to you?" — with an explicit reason and explicit
 * consent. People who want to be contacted say so; people who wanted only the
 * answer take it and leave, which is fine and expected.
 *
 * That converts worse than a gate on paper. It converts better in practice,
 * because the people who do leave details have already seen that we know what
 * we are talking about.
 */

export type LeadSource = 'triage_result' | 'contact_form' | 'callback_request' | 'guide';

export interface LeadInput {
  name?: string;
  email?: string;
  phone?: string;
  /** What they told us about their case. Free text, optional. */
  message?: string;
  source: LeadSource;
  /** Snapshot of the free-check answer, so we can pick up where they left off. */
  caseSummary?: {
    regime?: string;
    heirCount?: number;
    assetKinds?: string[];
    needsAdvocate?: boolean;
    suggestedTier?: string;
  };
  /** Explicit, unbundled, DPDP-style consent. Must be true. */
  consentToContact: boolean;
  /** Separate opt-in. Never bundled with the one above. */
  consentToUpdates?: boolean;
}

export type LeadError =
  | 'no_contact' | 'bad_email' | 'bad_phone' | 'no_consent' | 'message_too_long' | 'name_too_long';

export interface LeadOk { ok: true; lead: NormalisedLead }
export interface LeadFail { ok: false; error: LeadError; message: string }

export interface NormalisedLead {
  name: string | null;
  email: string | null;
  /** E.164 without the plus: 919876543210. One shape in the database. */
  phone: string | null;
  message: string | null;
  source: LeadSource;
  caseSummary: LeadInput['caseSummary'] | null;
  consentToUpdates: boolean;
}

/**
 * Deliberately permissive on the local part and strict on the shape. The only
 * real test of an email address is sending to it, so anything stricter than
 * this rejects valid addresses (plus-addressing, long TLDs, apostrophes) for
 * no benefit.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function normaliseEmail(raw: string): string | null {
  const e = raw.trim().toLowerCase();
  if (e.length < 5 || e.length > 254) return null;
  return EMAIL_RE.test(e) ? e : null;
}

/**
 * Indian mobile numbers: ten digits beginning 6, 7, 8 or 9. Accepts the many
 * ways people type them — +91, 0091, leading 0, spaces, dashes, brackets —
 * and stores exactly one shape.
 *
 * Landlines are deliberately rejected: we send an SMS to confirm a callback,
 * and a landline silently never receives it.
 */
export function normalisePhone(raw: string): string | null {
  let ten = raw.replace(/\D/g, '');

  // Peel prefixes in the order they nest, rather than trying to enumerate
  // every combination: 00 (international access) then 91 (country) then 0
  // (domestic trunk). "0091 98765 43210" needs all three.
  if (ten.startsWith('00')) ten = ten.slice(2);
  if (ten.length === 12 && ten.startsWith('91')) ten = ten.slice(2);
  if (ten.length === 11 && ten.startsWith('0')) ten = ten.slice(1);

  if (ten.length !== 10) return null;
  if (!/^[6-9]\d{9}$/.test(ten)) return null;

  return `91${ten}`;
}

/** Formats for display: +91 98765 43210 */
export function formatPhone(stored: string): string {
  if (!/^91\d{10}$/.test(stored)) return stored;
  const t = stored.slice(2);
  return `+91 ${t.slice(0, 5)} ${t.slice(5)}`;
}

const MAX_MESSAGE = 2000;
const MAX_NAME = 120;

export function validateLead(input: LeadInput): LeadOk | LeadFail {
  if (!input.consentToContact) {
    return {
      ok: false, error: 'no_consent',
      message: 'Please tick the box so we know it is alright to contact you.',
    };
  }

  const hasEmail = Boolean(input.email?.trim());
  const hasPhone = Boolean(input.phone?.trim());

  if (!hasEmail && !hasPhone) {
    return {
      ok: false, error: 'no_contact',
      message: 'Please give us either an email address or a mobile number so we can reach you.',
    };
  }

  let email: string | null = null;
  if (hasEmail) {
    email = normaliseEmail(input.email!);
    if (!email) {
      return {
        ok: false, error: 'bad_email',
        message: 'That email address does not look complete. Please check it.',
      };
    }
  }

  let phone: string | null = null;
  if (hasPhone) {
    phone = normalisePhone(input.phone!);
    if (!phone) {
      return {
        ok: false, error: 'bad_phone',
        message: 'Please enter a 10-digit Indian mobile number. We send a confirmation by SMS, so a landline will not work.',
      };
    }
  }

  const name = input.name?.trim() ?? '';
  if (name.length > MAX_NAME) {
    return { ok: false, error: 'name_too_long', message: 'That name is longer than we can store.' };
  }

  const message = input.message?.trim() ?? '';
  if (message.length > MAX_MESSAGE) {
    return {
      ok: false, error: 'message_too_long',
      message: `Please keep this under ${MAX_MESSAGE} characters. You can tell us the rest when we speak.`,
    };
  }

  return {
    ok: true,
    lead: {
      name: name || null,
      email,
      phone,
      message: message || null,
      source: input.source,
      caseSummary: input.caseSummary ?? null,
      consentToUpdates: Boolean(input.consentToUpdates),
    },
  };
}

/**
 * The case summary is the ONLY thing carried over from the free check, and it
 * deliberately holds no names, no institutions and no amounts — just the shape
 * of the case, so whoever calls back knows what they are looking at.
 */
export function summariseForLead(input: {
  regime: string;
  heirCount: number;
  assetKinds: string[];
  needsAdvocate: boolean;
  suggestedTier: string;
}): NonNullable<LeadInput['caseSummary']> {
  return {
    regime: input.regime,
    heirCount: input.heirCount,
    assetKinds: [...new Set(input.assetKinds)].slice(0, 12),
    needsAdvocate: input.needsAdvocate,
    suggestedTier: input.suggestedTier,
  };
}
