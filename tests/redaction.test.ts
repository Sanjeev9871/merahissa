import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import {
  redactCase, rehydrate, assertNoPii, mask, PiiLeakError,
  type CaseInput,
} from '../src/lib/redaction.ts';

const sampleCase: CaseInput = {
  caseId: '3f7a1c2e-9b4d-4e8a-8c1f-5d2e6a9b3c7d',
  deceasedName: 'Ramesh Kumar Gupta',
  deceasedDateOfDeath: '2025-11-14',
  regime: 'hindu',
  hasWill: false,
  heirs: [
    { id: 'h1', fullName: 'Sunita Gupta', relationship: 'spouse', isMinor: false, isClaimant: true },
    { id: 'h2', fullName: 'Arjun Gupta', relationship: 'son', isMinor: false, isClaimant: true },
    { id: 'h3', fullName: 'Priya Gupta', relationship: 'daughter', isMinor: true, isClaimant: true },
  ],
  assets: [
    {
      id: 'a1', kind: 'bank_deposit', institution: 'State Bank of India',
      accountRef: '20134567890', valueBand: '5L_to_10L', hasNomination: false, isJoint: false,
    },
    {
      id: 'a2', kind: 'iepf_shares', institution: 'IEPF Authority',
      accountRef: null, valueBand: 'over_10L', hasNomination: null, isJoint: false,
    },
  ],
};

describe('redactCase', () => {
  it('produces a payload containing no real names', () => {
    const { payload } = redactCase(sampleCase);
    const json = JSON.stringify(payload);

    expect(json).not.toContain('Ramesh');
    expect(json).not.toContain('Gupta');
    expect(json).not.toContain('Sunita');
    expect(json).not.toContain('Arjun');
    expect(json).not.toContain('Priya');
    expect(json).not.toContain('State Bank of India');
    expect(json).not.toContain('20134567890');
  });

  it('preserves the structural facts the model needs to reason', () => {
    const { payload } = redactCase(sampleCase);

    expect(payload.regime).toBe('hindu');
    expect(payload.hasWill).toBe(false);
    expect(payload.heirs).toHaveLength(3);
    expect(payload.heirs.map((h) => h.relationship)).toEqual(['spouse', 'son', 'daughter']);
    expect(payload.heirs[2]?.isMinor).toBe(true);
    expect(payload.assets[0]?.kind).toBe('bank_deposit');
    expect(payload.assets[0]?.valueBand).toBe('5L_to_10L');
    expect(payload.assets[0]?.hasNomination).toBe(false);
  });

  it('builds a reversible map', () => {
    const { payload, map } = redactCase(sampleCase);
    expect(map.get(payload.deceased.token)).toBe('Ramesh Kumar Gupta');
    expect(map.get(payload.heirs[0]!.token)).toBe('Sunita Gupta');
    expect(map.get(payload.assets[0]!.institutionToken)).toBe('State Bank of India');
    expect(map.get(payload.assets[0]!.accountToken!)).toBe('20134567890');
  });

  it('does not emit an account token when there is no account reference', () => {
    const { payload } = redactCase(sampleCase);
    expect(payload.assets[1]?.accountToken).toBeNull();
  });

  it('never exposes the raw case UUID', () => {
    const { payload } = redactCase(sampleCase);
    expect(payload.caseRef).not.toBe(sampleCase.caseId);
    expect(JSON.stringify(payload)).not.toContain(sampleCase.caseId);
  });
});

describe('rehydrate', () => {
  it('restores real values into model prose', () => {
    const { payload, map } = redactCase(sampleCase);
    const modelOutput =
      `The claimant ${payload.heirs[0]!.token}, being the spouse of ` +
      `${payload.deceased.token}, must file Form TR-1 with ` +
      `${payload.assets[0]!.institutionToken}.`;

    const { text, unresolved } = rehydrate(modelOutput, map);

    expect(text).toBe(
      'The claimant Sunita Gupta, being the spouse of Ramesh Kumar Gupta, ' +
      'must file Form TR-1 with State Bank of India.',
    );
    expect(unresolved).toEqual([]);
  });

  it('reports hallucinated tokens instead of shipping them', () => {
    const { map } = redactCase(sampleCase);
    const { text, unresolved } = rehydrate('Notify {{HEIR_9}} and {{UNKNOWN_THING}}.', map);

    expect(unresolved).toEqual(['{{HEIR_9}}', '{{UNKNOWN_THING}}']);
    expect(text).toContain('{{HEIR_9}}');
  });
});

describe('assertNoPii — the fail-closed guard', () => {
  it('passes a properly redacted payload', () => {
    const { payload } = redactCase(sampleCase);
    expect(() => assertNoPii(payload, 'test')).not.toThrow();
  });

  const leaks: Array<[string, unknown]> = [
    ['PAN', { note: 'PAN is ABCDE1234F' }],
    ['Aadhaar', { note: '1234 5678 9012' }],
    ['Aadhaar (unspaced)', { note: '123456789012' }],
    ['IFSC code', { note: 'SBIN0001234' }],
    ['phone number', { contact: '9876543210' }],
    ['phone number (+91)', { contact: '+91 9876543210' }],
    ['email address', { contact: 'sunita.gupta@example.com' }],
    ['account-like number', { acct: '20134567890' }],
    ['nested leak', { assets: [{ meta: { ref: 'ABCDE1234F' } }] }],
    ['leak in array', { notes: ['fine', 'call 9876543210'] }],
  ];

  for (const [label, payload] of leaks) {
    it(`throws on ${label}`, () => {
      expect(() => assertNoPii(payload, 'test')).toThrow(PiiLeakError);
    });
  }

  it('does not put the offending value into the error message', () => {
    try {
      assertNoPii({ note: 'ABCDE1234F' }, 'outbound');
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(PiiLeakError);
      expect((e as Error).message).not.toContain('ABCDE1234F');
      expect((e as Error).message).toContain('PAN');
    }
  });

  it('does not flag legitimate placeholder tokens', () => {
    expect(() => assertNoPii({ a: '{{HEIR_1}}', b: '{{ACCOUNT_1}}' }, 'test')).not.toThrow();
  });

  it('catches a field added later without redaction — the regression this exists for', () => {
    const { payload } = redactCase(sampleCase);
    const careless = { ...payload, extra: { contactEmail: 'heir@example.com' } };
    expect(() => assertNoPii(careless, 'outbound')).toThrow(PiiLeakError);
  });
});

describe('mask', () => {
  it('shows only the last four characters', () => {
    expect(mask('ABCDE1234F')).toBe('XXXXXX234F');
    expect(mask('1234 5678 9012')).toBe('XXXXXXXX9012');
  });

  it('fully masks values shorter than the visible window', () => {
    expect(mask('123')).toBe('XXX');
  });
});
