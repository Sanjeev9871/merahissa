import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

/**
 * Application-layer encryption for government ID numbers.
 *
 * Supabase already encrypts at rest, but that key belongs to the database. If
 * a backup, a dump, or an over-permissioned service-role query escapes, disk
 * encryption does not help. These columns are encrypted with a key that lives
 * only in the application environment, so a database compromise alone yields
 * ciphertext.
 *
 * AES-256-GCM: authenticated, so tampering with stored ciphertext is detected
 * rather than silently decrypting to garbage.
 *
 * Server-only. Importing this in a client component will fail the build,
 * which is the intended behaviour.
 */

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit nonce, the GCM standard
const TAG_BYTES = 16;

let cachedKey: Buffer | null = null;

function key(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.PII_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      'PII_ENCRYPTION_KEY is not set. Generate one with: openssl rand -base64 32',
    );
  }

  const buf = Buffer.from(raw, 'base64');
  if (buf.length !== 32) {
    throw new Error(
      `PII_ENCRYPTION_KEY must decode to exactly 32 bytes, got ${buf.length}.`,
    );
  }

  cachedKey = buf;
  return buf;
}

/**
 * Returns base64 of iv || ciphertext || authTag, so one column holds
 * everything needed to decrypt and verify.
 */
export function encryptPii(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, enc, cipher.getAuthTag()]).toString('base64');
}

export function decryptPii(stored: string): string {
  const buf = Buffer.from(stored, 'base64');
  if (buf.length < IV_BYTES + TAG_BYTES) {
    throw new Error('Ciphertext is too short to be valid.');
  }

  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(buf.length - TAG_BYTES);
  const body = buf.subarray(IV_BYTES, buf.length - TAG_BYTES);

  const decipher = createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
}

/**
 * One-way hash for values we need to compare but never read back — the
 * consent IP is the example. Storing a raw IP alongside a death certificate
 * is data we have no use for; a salted hash still proves consent came from a
 * consistent origin.
 */
export function hashForAudit(value: string): string {
  const salt = process.env.PII_ENCRYPTION_KEY ?? '';
  return createHash('sha256').update(`${salt}:${value}`).digest('hex');
}
