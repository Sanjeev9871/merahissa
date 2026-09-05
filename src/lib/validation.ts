import { z } from 'zod';

/**
 * Input validation.
 *
 * Every mutation validates here, server-side, without exception. Client-side
 * validation exists for the user's benefit; this exists for the system's.
 *
 * Note the deliberate absence of Aadhaar and PAN from the intake schemas.
 * They are collected in a separate, narrower flow that writes straight to an
 * encrypted column, so they cannot ride along inside a general case payload
 * and end up somewhere they should not be.
 */

export const REGIMES = [
  'hindu', 'muslim_sunni', 'muslim_shia', 'christian', 'parsi', 'testate', 'unknown',
] as const;

export const RELATIONSHIPS = [
  'spouse', 'son', 'daughter', 'mother', 'father',
  'brother', 'sister', 'grandson', 'granddaughter', 'other',
] as const;

export const ASSET_KINDS = [
  'bank_deposit', 'demat_shares', 'mutual_fund', 'insurance_policy',
  'epf', 'ppf', 'nps', 'iepf_shares', 'post_office', 'safe_deposit', 'other',
] as const;

export const VALUE_BANDS = ['under_1L', '1L_to_5L', '5L_to_10L', 'over_10L', 'unknown'] as const;

/** Rejects control characters and trims. Names are printed onto legal forms. */
const personName = z
  .string()
  .trim()
  .min(2, 'Please enter the full name.')
  .max(120, 'That name is longer than any form will accept.')
  .regex(/^[^\x00-\x1f<>]+$/, 'That name contains characters we cannot print on a form.');

export const triageSchema = z.object({
  hasWill: z.boolean(),
  regime: z.enum(REGIMES),
  assetKinds: z.array(z.enum(ASSET_KINDS)).min(1, 'Select at least one kind of asset.'),
  anyNomination: z.enum(['yes', 'no', 'unsure']),
});

export const heirSchema = z.object({
  fullName: personName,
  relationship: z.enum(RELATIONSHIPS),
  isMinor: z.boolean().default(false),
  isClaimant: z.boolean().default(true),
});

export const assetSchema = z.object({
  kind: z.enum(ASSET_KINDS),
  institution: z.string().trim().min(2, 'Which bank, company or fund holds this?').max(160),
  /**
   * The full account, folio or policy reference, because the institutional
   * claim forms we fill require it printed in full. It is encrypted at rest
   * (AES-256-GCM, `assets.account_ref_enc`), displayed to the family only
   * masked, never sent to any AI provider — the redaction layer substitutes a
   * token before the request and `assertNoPii` fails closed on any digit run
   * that looks like an account number — and deleted with the case.
   *
   * Deliberately permissive on shape: bank accounts are 9-18 digits, demat IDs
   * 16, but mutual fund folios and policy numbers are alphanumeric and vary by
   * registrar. Rejecting a valid reference is worse than accepting an odd one,
   * since the family can see what they typed on the finished form.
   */
  accountRef: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9/-]{3,31}$/, 'Enter the account, folio or policy number as it appears on the statement.')
    .optional(),
  valueBand: z.enum(VALUE_BANDS).default('unknown'),
  hasNomination: z.boolean().nullable().default(null),
  isJoint: z.boolean().default(false),
});

export const caseSchema = z.object({
  deceasedName: personName,
  deceasedDateOfDeath: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the date picker.')
    .refine((d) => new Date(d) <= new Date(), 'That date is in the future.')
    .optional(),
  deceasedWasFemale: z.boolean().default(false),
  regime: z.enum(REGIMES),
  hasWill: z.boolean().default(false),
  willIsRegistered: z.boolean().nullable().default(null),
  heirs: z.array(heirSchema)
    .min(1, 'Add at least one heir.')
    .max(25, 'More than 25 heirs needs manual handling — we will be in touch.'),
  assets: z.array(assetSchema)
    .min(1, 'Add at least one asset.')
    .max(50, 'More than 50 assets needs manual handling — we will be in touch.'),
});

export const consentSchema = z.object({
  version: z.string().min(1),
  accepted: z.literal(true, {
    errorMap: () => ({ message: 'We cannot proceed without your consent.' }),
  }),
});

export type TriageInput = z.infer<typeof triageSchema>;
export type CaseFormInput = z.infer<typeof caseSchema>;
export type HeirInput = z.infer<typeof heirSchema>;
export type AssetInput = z.infer<typeof assetSchema>;

/**
 * Uploads. Deliberately restrictive: a claim pack needs scans, not archives.
 * An allowlist of three MIME types removes a large class of upload attacks.
 */
export const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const uploadSchema = z.object({
  docType: z.enum([
    'death_certificate', 'claimant_id', 'address_proof', 'bank_statement',
    'share_certificate', 'policy_document', 'will', 'other',
  ]),
  mimeType: z.enum(ALLOWED_UPLOAD_TYPES),
  bytes: z.number().int().positive().max(MAX_UPLOAD_BYTES, 'Files must be under 8 MB.'),
  /** Set client-side after OCR, confirmed by the user before upload. */
  ocrFields: z.record(z.string()).optional(),
});

/**
 * Formats Zod errors as field -> message, which is what the wizard renders.
 * Never returns the submitted values, so a validation log cannot become a
 * copy of the case data.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    out[key] ??= issue.message;
  }
  return out;
}
