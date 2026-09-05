import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import { encryptPii, decryptPii } from '../src/lib/crypto.ts';
import { redactCase, assertNoPii, mask, PiiLeakError } from '../src/lib/redaction.ts';
import { assetSchema } from '../src/lib/validation.ts';

/**
 * The full account reference is the most sensitive field we now hold. These
 * tests pin the three properties that make holding it defensible: it is
 * encrypted at rest, it is masked before it is ever displayed, and it cannot
 * reach an AI provider in the clear.
 */

// A key only for these tests. Never a real one.
const TEST_KEY = Buffer.alloc(32, 7).toString('base64');

describe('account reference is encrypted at rest', () => {
  it('round-trips through AES-256-GCM', () => {
    process.env.PII_ENCRYPTION_KEY = TEST_KEY;
    const account = '50100234567890';
    const stored = encryptPii(account);

    // The stored form must not contain the plaintext anywhere.
    expect(stored.includes(account)).toBe(false);
    expect(decryptPii(stored)).toBe(account);
  });

  it('produces different ciphertext each time, so equal accounts are not linkable', () => {
    process.env.PII_ENCRYPTION_KEY = TEST_KEY;
    const a = encryptPii('50100234567890');
    const b = encryptPii('50100234567890');
    expect(a === b).toBe(false);
  });

  it('detects tampering rather than decrypting to garbage', () => {
    process.env.PII_ENCRYPTION_KEY = TEST_KEY;
    const stored = encryptPii('50100234567890');
    const raw = Buffer.from(stored, 'base64');
    raw[raw.length - 1] ^= 0xff;                     // flip a bit in the auth tag

    let threw = false;
    try { decryptPii(raw.toString('base64')); } catch { threw = true; }
    expect(threw).toBe(true);
  });
});

describe('account reference is masked before display', () => {
  it('shows only the last four characters', () => {
    expect(mask('50100234567890')).toBe('XXXXXXXXXX7890');
  });
});

describe('account reference never reaches the model', () => {
  const caseInput = {
    caseId: '11111111-2222-3333-4444-555555555555',
    deceasedName: 'Ramesh Kumar Gupta',
    regime: 'hindu' as const,
    hasWill: false,
    heirs: [{ id: 'h1', fullName: 'Sunita Gupta', relationship: 'spouse', isMinor: false, isClaimant: true }],
    assets: [{
      id: 'a1',
      kind: 'bank_deposit' as const,
      institution: 'State Bank of India',
      accountRef: '50100234567890',
      valueBand: '1L_to_5L' as const,
      hasNomination: false,
      isJoint: false,
    }],
  };

  it('substitutes a token for the account number in the outbound payload', () => {
    const { payload, map } = redactCase(caseInput);
    const serialised = JSON.stringify(payload);

    expect(serialised.includes('50100234567890')).toBe(false);
    expect(payload.assets[0]!.accountToken).toBe('{{ACCOUNT_1}}');
    // The real value survives only in the server-side map, for rehydration.
    expect(map.get('{{ACCOUNT_1}}')).toBe('50100234567890');
  });

  it('the redacted payload passes the PII guard', () => {
    const { payload } = redactCase(caseInput);
    let threw = false;
    try { assertNoPii(payload, 'test'); } catch { threw = true; }
    expect(threw).toBe(false);
  });

  it('the guard fails closed if a raw account number ever leaks into a payload', () => {
    // This is the backstop: if someone later adds a field and forgets to
    // tokenise it, the request must die rather than leak.
    let caught: unknown = null;
    try {
      assertNoPii({ note: 'account 50100234567890 belongs to the deceased' }, 'test');
    } catch (e) { caught = e; }

    expect(caught instanceof PiiLeakError).toBe(true);
  });
});

describe('account reference validation', () => {
  const parse = (accountRef: string) =>
    assetSchema.safeParse({
      kind: 'bank_deposit', institution: 'State Bank of India', accountRef,
      valueBand: 'unknown', hasNomination: null, isJoint: false,
    }).success;

  it('accepts real-world references', () => {
    expect(parse('50100234567890')).toBe(true);      // bank account
    expect(parse('IN30012345678901')).toBe(true);    // demat
    expect(parse('91234567/12')).toBe(true);         // folio with separator
  });

  it('rejects something too short to be a reference', () => {
    expect(parse('12')).toBe(false);
  });
});
