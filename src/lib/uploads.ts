import { createHash } from 'node:crypto';

/**
 * Upload validation.
 *
 * The rule this file exists to enforce: a file's claimed type is a claim, not
 * a fact. `Content-Type` and the filename extension are both attacker-
 * controlled. We check the actual leading bytes.
 *
 * Why it matters here specifically: uploads go into Supabase storage and come
 * back out through signed URLs that a browser will render. A file that claims
 * to be image/png but is actually HTML becomes stored XSS the moment someone
 * opens it — and the person opening it is an admin reviewing a case, with a
 * session that can read every case in the system.
 */

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;   // 8 MB
export const MIN_UPLOAD_BYTES = 64;                // below this it isn't a scan

export type RejectionReason =
  | 'too_large' | 'too_small' | 'disallowed_type'
  | 'content_mismatch' | 'unrecognised_content';

export interface ValidationOk {
  ok: true;
  mime: AllowedMime;
  bytes: number;
  sha256: string;
  /** Safe, generated storage name. Never the user's filename. */
  storageName: string;
}

export interface ValidationFail {
  ok: false;
  reason: RejectionReason;
  /** Shown to the user. Explains the problem and the fix, no blame. */
  message: string;
}

export type ValidationResult = ValidationOk | ValidationFail;

/** Leading-byte signatures for the three types we accept. */
const MAGIC: Array<{ mime: AllowedMime; bytes: number[]; offset: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff], offset: 0 },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0 },
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d], offset: 0 },   // "%PDF-"
];

export function sniffMime(data: Uint8Array): AllowedMime | null {
  for (const sig of MAGIC) {
    if (data.length < sig.offset + sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (data[sig.offset + i] !== sig.bytes[i]) { match = false; break; }
    }
    if (match) return sig.mime;
  }
  return null;
}

function isAllowed(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}

/**
 * Full validation. Order matters: cheap checks before hashing, and the
 * content check last because it is the one that requires reading the bytes.
 */
export function validateUpload(opts: {
  data: Uint8Array;
  claimedMime: string;
}): ValidationResult {
  const { data, claimedMime } = opts;

  if (data.length > MAX_UPLOAD_BYTES) {
    return {
      ok: false, reason: 'too_large',
      message: 'That file is larger than 8 MB. Please scan at a lower resolution, '
             + 'or photograph the page instead of scanning it.',
    };
  }

  if (data.length < MIN_UPLOAD_BYTES) {
    return {
      ok: false, reason: 'too_small',
      message: 'That file looks empty. Please check it opens on your device and try again.',
    };
  }

  if (!isAllowed(claimedMime)) {
    return {
      ok: false, reason: 'disallowed_type',
      message: 'We accept JPG, PNG and PDF files only. If you have a Word document, '
             + 'please export it as a PDF first.',
    };
  }

  const actual = sniffMime(data);

  if (actual === null) {
    return {
      ok: false, reason: 'unrecognised_content',
      message: 'We could not read that file as an image or a PDF. It may be damaged. '
             + 'Please try re-scanning or re-exporting it.',
    };
  }

  // The claim disagrees with the content. This is either a corrupted export or
  // someone probing us; either way we do not store it.
  if (actual !== claimedMime) {
    return {
      ok: false, reason: 'content_mismatch',
      message: 'That file\'s contents do not match its file type. Please re-export '
             + 'it from the original application and try again.',
    };
  }

  return {
    ok: true,
    mime: actual,
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
    storageName: storageNameFor(actual),
  };
}

/**
 * Storage names are generated, never derived from the user's filename.
 *
 * User filenames routinely contain the deceased's name ("papa death cert.pdf"),
 * which would put PII into a storage path that appears in logs, signed URLs
 * and error reports. They are also a path-traversal vector. We keep neither.
 */
function storageNameFor(mime: AllowedMime): string {
  const ext = mime === 'application/pdf' ? 'pdf' : mime === 'image/png' ? 'png' : 'jpg';
  // 16 random bytes is ample; collisions are not a practical concern and the
  // path is already scoped by case id.
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${rand}.${ext}`;
}

/** Full object path inside the private bucket. */
export function storagePath(caseId: string, storageName: string): string {
  return `${caseId}/${storageName}`;
}

/**
 * Signed URL lifetime.
 *
 * Ten minutes: long enough to click through and download, short enough that a
 * URL leaked into a chat, a screenshot or a browser history is dead by the
 * time anyone tries it. Signed URLs bypass RLS by design, so they are the one
 * place case data is reachable without a session.
 */
export const SIGNED_URL_TTL_SECONDS = 600;

/** Retention: 90 days after a case closes. */
export const RETENTION_DAYS = 90;

export function purgeDateFrom(closedAt: Date): Date {
  const d = new Date(closedAt);
  d.setDate(d.getDate() + RETENTION_DAYS);
  return d;
}
