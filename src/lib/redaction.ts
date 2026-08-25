/**
 * PII redaction — the single most security-critical module in Virasat.
 *
 * THE RULE: no real person's identifying data ever reaches a third-party AI
 * provider. We use free-tier inference, which means the provider is untrusted
 * by construction.
 *
 * Two mechanisms, in order of importance:
 *
 *  1. REDACTION BY CONSTRUCTION (primary). We never hand the model free text
 *     and hope a scrubber catches everything. We build the outbound payload
 *     from typed, structured case data, substituting every identifying value
 *     for a placeholder token as we go. The model reasons about the SHAPE of
 *     a case — regime, asset kinds, institutions, thresholds — and writes
 *     prose containing tokens. It never sees a name.
 *
 *  2. THE GUARD (defence in depth). assertNoPii() scans the finished payload
 *     for identifier patterns immediately before the network call and THROWS
 *     if it finds any. This is a fail-closed backstop for the case where
 *     someone later adds a field and forgets to redact it. A thrown error and
 *     a failed case is an acceptable outcome. A leaked Aadhaar is not.
 *
 * Some values are never tokenised at all — they are dropped. Aadhaar and PAN
 * have no legitimate role in the model's reasoning, so they do not enter the
 * payload in any form, not even as a placeholder that could later be
 * rehydrated into a logged prompt.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Regime =
  | 'hindu' | 'muslim_sunni' | 'muslim_shia'
  | 'christian' | 'parsi' | 'testate' | 'unknown';

export type AssetKind =
  | 'bank_deposit' | 'demat_shares' | 'mutual_fund' | 'insurance_policy'
  | 'epf' | 'ppf' | 'nps' | 'iepf_shares' | 'post_office'
  | 'safe_deposit' | 'other';

export type ValueBand =
  | 'under_1L' | '1L_to_5L' | '5L_to_10L' | 'over_10L' | 'unknown';

/** Raw case data as held in our database — contains real PII. */
export interface CaseInput {
  caseId: string;
  deceasedName: string;
  deceasedDateOfDeath?: string | null;
  regime: Regime;
  hasWill: boolean;
  willIsRegistered?: boolean | null;
  heirs: Array<{
    id: string;
    fullName: string;
    relationship: string;
    isMinor: boolean;
    isClaimant: boolean;
  }>;
  assets: Array<{
    id: string;
    kind: AssetKind;
    institution: string;
    accountRef?: string | null;
    valueBand: ValueBand;
    hasNomination?: boolean | null;
    isJoint: boolean;
  }>;
}

/** What actually goes over the wire. Structurally cannot hold a real name. */
export interface RedactedCase {
  caseRef: string;
  deceased: { token: string; dateOfDeath: string | null };
  regime: Regime;
  hasWill: boolean;
  willIsRegistered: boolean | null;
  heirs: Array<{
    token: string;
    relationship: string;
    isMinor: boolean;
    isClaimant: boolean;
  }>;
  assets: Array<{
    token: string;
    kind: AssetKind;
    institutionToken: string;
    accountToken: string | null;
    valueBand: ValueBand;
    hasNomination: boolean | null;
    isJoint: boolean;
  }>;
}

/** token -> real value. Lives only in server memory and Postgres. */
export type TokenMap = Map<string, string>;

export class PiiLeakError extends Error {
  // Declared as plain fields rather than constructor parameter properties so
  // the module runs unchanged under Node's type-stripping, which cannot emit
  // the assignment code parameter properties imply.
  readonly kind: string;
  readonly context: string;

  constructor(kind: string, context: string) {
    // Deliberately does NOT include the offending value. An error message is
    // the one place a leaked identifier would reliably end up in logs.
    super(`Blocked outbound payload: possible ${kind} detected in ${context}`);
    this.name = 'PiiLeakError';
    this.kind = kind;
    this.context = context;
  }
}

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

const TOKEN_RE = /^\{\{[A-Z0-9_]+\}\}$/;

function token(kind: string, index: number): string {
  return `{{${kind}_${index}}}`;
}

/**
 * Institution names are NOT personal data — "State Bank of India" identifies
 * nobody. We still tokenise them so the model cannot infer a household's
 * banking relationships from a prompt that gets logged provider-side, but we
 * pass the institution TYPE through so the model can still reason about which
 * forms apply. Rehydration restores the real name.
 */
export function redactCase(input: CaseInput): { payload: RedactedCase; map: TokenMap } {
  const map: TokenMap = new Map();

  const deceasedToken = token('DECEASED', 1);
  map.set(deceasedToken, input.deceasedName);

  const heirs = input.heirs.map((h, i) => {
    const t = token('HEIR', i + 1);
    map.set(t, h.fullName);
    return {
      token: t,
      relationship: h.relationship,
      isMinor: h.isMinor,
      isClaimant: h.isClaimant,
    };
  });

  const assets = input.assets.map((a, i) => {
    const assetToken = token('ASSET', i + 1);
    const instToken = token('INSTITUTION', i + 1);
    map.set(instToken, a.institution);

    let acctToken: string | null = null;
    if (a.accountRef) {
      acctToken = token('ACCOUNT', i + 1);
      map.set(acctToken, a.accountRef);
    }

    return {
      token: assetToken,
      kind: a.kind,
      institutionToken: instToken,
      accountToken: acctToken,
      valueBand: a.valueBand,
      hasNomination: a.hasNomination ?? null,
      isJoint: a.isJoint,
    };
  });

  const payload: RedactedCase = {
    // Not the real case UUID — that is an internal identifier we have no
    // reason to expose. A short opaque ref is enough for the model to
    // reference the case in its output.
    caseRef: `CASE-${input.caseId.slice(0, 8).toUpperCase()}`,
    deceased: { token: deceasedToken, dateOfDeath: input.deceasedDateOfDeath ?? null },
    regime: input.regime,
    hasWill: input.hasWill,
    willIsRegistered: input.willIsRegistered ?? null,
    heirs,
    assets,
  };

  return { payload, map };
}

/**
 * Restore real values into model output. Server-side only, after the response
 * has come back. Unknown tokens are left intact and reported so the review
 * queue can flag a hallucinated placeholder rather than shipping "{{HEIR_7}}"
 * to a grieving family.
 */
export function rehydrate(
  text: string,
  map: TokenMap,
): { text: string; unresolved: string[] } {
  const unresolved = new Set<string>();

  const out = text.replace(/\{\{[A-Z0-9_]+\}\}/g, (match) => {
    const value = map.get(match);
    if (value === undefined) {
      unresolved.add(match);
      return match;
    }
    return value;
  });

  return { text: out, unresolved: [...unresolved] };
}

// ---------------------------------------------------------------------------
// The guard
// ---------------------------------------------------------------------------

/**
 * Patterns are deliberately BROAD. This scans a payload that should contain
 * nothing but tokens, enum values and booleans, so a false positive costs us
 * one regenerated case while a false negative costs a family their privacy.
 * We bias hard toward false positives.
 */
const PII_PATTERNS: Array<{ kind: string; re: RegExp }> = [
  // PAN: five letters, four digits, one letter.
  { kind: 'PAN', re: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/ },
  // Aadhaar: 12 digits, optionally grouped 4-4-4.
  { kind: 'Aadhaar', re: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/ },
  // IFSC: four letters, a zero, six alphanumerics.
  { kind: 'IFSC code', re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/ },
  // Indian mobile, with or without country code.
  { kind: 'phone number', re: /(?:\+?91[\s-]?)?\b[6-9]\d{9}\b/ },
  { kind: 'email address', re: /\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/ },
  // Any long digit run — bank accounts (9–18), demat IDs (16), card numbers.
  { kind: 'account-like number', re: /\b\d{9,18}\b/ },
];

/** Walk any JSON-ish value, yielding every string it contains. */
function* strings(value: unknown, path = '$'): Generator<[string, string]> {
  if (typeof value === 'string') {
    yield [value, path];
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${path}[${i}]`);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) yield* strings(v, `${path}.${k}`);
  }
}

/**
 * Throws PiiLeakError if the payload looks like it contains an identifier.
 * Call this immediately before every outbound AI request. There is no
 * "warn" mode by design — a soft failure here is a silent data leak.
 */
export function assertNoPii(value: unknown, context: string): void {
  for (const [str, path] of strings(value)) {
    // Placeholders are the whole point; never flag them.
    if (TOKEN_RE.test(str)) continue;

    for (const { kind, re } of PII_PATTERNS) {
      if (re.test(str)) {
        throw new PiiLeakError(kind, `${context} at ${path}`);
      }
    }
  }
}

/**
 * Mask an identifier for display and for printing onto forms.
 * Shows only the last `visible` characters. Used at write time so the
 * plaintext never lands in a column we might later render carelessly.
 */
export function mask(value: string, visible = 4): string {
  const clean = value.replace(/\s|-/g, '');
  if (clean.length <= visible) return 'X'.repeat(clean.length);
  return 'X'.repeat(clean.length - visible) + clean.slice(-visible);
}

/**
 * Fields that must never be tokenised, only dropped. Exported so tests can
 * assert the outbound payload type has no property with these names.
 */
export const NEVER_SEND = Object.freeze([
  'pan', 'aadhaar', 'panEnc', 'aadhaarEnc',
  'deceasedPan', 'deceasedAadhaar', 'accountRef', 'fullName', 'deceasedName',
] as const);
