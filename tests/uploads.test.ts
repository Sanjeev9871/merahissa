import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import {
  validateUpload, sniffMime, storagePath, purgeDateFrom,
  MAX_UPLOAD_BYTES, RETENTION_DAYS, SIGNED_URL_TTL_SECONDS,
} from '../src/lib/uploads.ts';

/** Build a byte array with a real file signature followed by filler. */
const withMagic = (magic: number[], size = 512): Uint8Array => {
  const buf = new Uint8Array(size);
  buf.set(magic, 0);
  for (let i = magic.length; i < size; i++) buf[i] = 0x41;
  return buf;
};

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37];
const HTML = [...Buffer.from('<!DOCTYPE html><script>')];

describe('magic-byte sniffing', () => {
  it('identifies the three types we accept', () => {
    expect(sniffMime(withMagic(JPEG))).toBe('image/jpeg');
    expect(sniffMime(withMagic(PNG))).toBe('image/png');
    expect(sniffMime(withMagic(PDF))).toBe('application/pdf');
  });

  it('returns null for anything else', () => {
    expect(sniffMime(withMagic(HTML))).toBeNull();
    expect(sniffMime(new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBeNull();   // zip
    expect(sniffMime(new Uint8Array(0))).toBeNull();
  });

  it('does not read past the end of a short buffer', () => {
    expect(sniffMime(new Uint8Array([0x89, 0x50]))).toBeNull();
  });
});

describe('validateUpload — accepting good files', () => {
  it('accepts a genuine JPEG', () => {
    const r = validateUpload({ data: withMagic(JPEG), claimedMime: 'image/jpeg' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mime).toBe('image/jpeg');
      expect(r.bytes).toBe(512);
      expect(r.sha256.length).toBe(64);
      expect(r.storageName.endsWith('.jpg')).toBe(true);
    }
  });

  it('accepts genuine PNG and PDF with the right extensions', () => {
    const png = validateUpload({ data: withMagic(PNG), claimedMime: 'image/png' });
    const pdf = validateUpload({ data: withMagic(PDF), claimedMime: 'application/pdf' });
    expect(png.ok).toBe(true);
    expect(pdf.ok).toBe(true);
    if (png.ok) expect(png.storageName.endsWith('.png')).toBe(true);
    if (pdf.ok) expect(pdf.storageName.endsWith('.pdf')).toBe(true);
  });

  it('hashes content, so identical files hash identically', () => {
    const a = validateUpload({ data: withMagic(PDF), claimedMime: 'application/pdf' });
    const b = validateUpload({ data: withMagic(PDF), claimedMime: 'application/pdf' });
    if (a.ok && b.ok) {
      expect(a.sha256).toBe(b.sha256);
      // ...but storage names are random, so one upload never overwrites another.
      expect(a.storageName).not.toBe(b.storageName);
    }
  });
});

describe('validateUpload — the attacks this exists to stop', () => {
  it('rejects HTML masquerading as a PNG', () => {
    // The stored-XSS path: an admin opens this via a signed URL with a
    // session that can read every case in the system.
    const r = validateUpload({ data: withMagic(HTML), claimedMime: 'image/png' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('unrecognised_content');
  });

  it('rejects a PDF claiming to be a JPEG', () => {
    const r = validateUpload({ data: withMagic(PDF), claimedMime: 'image/jpeg' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('content_mismatch');
  });

  it('rejects a type we do not accept even if the bytes are genuine', () => {
    const r = validateUpload({ data: withMagic(PDF), claimedMime: 'application/zip' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('disallowed_type');
  });

  it('rejects a file over the size cap', () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(PDF, 0);
    const r = validateUpload({ data: big, claimedMime: 'application/pdf' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_large');
  });

  it('rejects an empty or near-empty file', () => {
    const r = validateUpload({ data: new Uint8Array(10), claimedMime: 'image/png' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_small');
  });

  it('never derives the storage name from a user filename', () => {
    // Traversal and PII-in-path both die here: the name is generated.
    const r = validateUpload({ data: withMagic(PNG), claimedMime: 'image/png' });
    if (r.ok) {
      expect(r.storageName).not.toContain('/');
      expect(r.storageName).not.toContain('..');
      expect(/^[0-9a-f]{32}\.(png|jpg|pdf)$/.test(r.storageName)).toBe(true);
    }
  });
});

describe('rejection messages', () => {
  it('explains the problem and the fix, without blaming the user', () => {
    const cases = [
      validateUpload({ data: new Uint8Array(10), claimedMime: 'image/png' }),
      validateUpload({ data: withMagic(HTML), claimedMime: 'image/png' }),
      validateUpload({ data: withMagic(PDF), claimedMime: 'application/zip' }),
    ];

    for (const r of cases) {
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.message.length > 30).toBe(true);
        // Someone bereaved should not be told they did something "invalid".
        expect(r.message.toLowerCase()).not.toContain('invalid');
        expect(r.message.toLowerCase()).not.toContain('error');
      }
    }
  });
});

describe('storage paths and retention', () => {
  it('scopes every object under its case id', () => {
    expect(storagePath('case-uuid', 'abc.pdf')).toBe('case-uuid/abc.pdf');
  });

  it('sets the purge date 90 days after closure', () => {
    const closed = new Date('2026-01-01T00:00:00Z');
    const purge = purgeDateFrom(closed);
    const days = Math.round((purge.getTime() - closed.getTime()) / 86_400_000);
    expect(days).toBe(RETENTION_DAYS);
    expect(days).toBe(90);
  });

  it('keeps signed URLs short-lived', () => {
    // Long enough to click through, short enough that a leaked URL is dead.
    expect(SIGNED_URL_TTL_SECONDS).toBe(600);
    expect(SIGNED_URL_TTL_SECONDS <= 900).toBe(true);
  });
});
