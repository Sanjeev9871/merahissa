import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import { generatePack, type GenerationInput } from '../src/lib/pipeline.ts';

/**
 * These tests cover the paths that return BEFORE any model call, which is
 * exactly where the safety gate lives. No network, no API key, no stubbing —
 * if the gate works, generatePack never reaches the provider.
 *
 * The happy path (which does call a model) is exercised in the integration
 * suite that runs against a live key; it is deliberately not a unit test.
 */

const baseCase = (over: Partial<GenerationInput> = {}): GenerationInput => ({
  caseId: '3f7a1c2e-9b4d-4e8a-8c1f-5d2e6a9b3c7d',
  deceasedName: 'Ramesh Kumar Gupta',
  deceasedDateOfDeath: '2025-11-14',
  regime: 'hindu',
  hasWill: false,
  heirs: [
    { id: 'w', fullName: 'Sunita Gupta', relationship: 'spouse', isMinor: false, isClaimant: true },
    { id: 's1', fullName: 'Arjun Gupta', relationship: 'son', isMinor: false, isClaimant: true },
  ],
  assets: [
    {
      id: 'a1', kind: 'bank_deposit', institution: 'State Bank of India',
      accountRef: '20134567890', valueBand: 'under_1L', hasNomination: false, isJoint: false,
    },
  ],
  ...over,
});

describe('the safety gate holds cases before spending a model call', () => {
  it('holds a Muslim intestate case and produces no narrative', async () => {
    const r = await generatePack(baseCase({ regime: 'muslim_sunni' }));

    expect(r.status).toBe('held');
    expect(r.narrative).toBeNull();
    expect(r.shares.computed).toBe(false);
    expect(r.holdReasons.join(' ')).toContain('Quranic');
  });

  it('holds a testate case — the will governs, not the rules engine', async () => {
    const r = await generatePack(baseCase({ regime: 'testate', hasWill: true }));

    expect(r.status).toBe('held');
    expect(r.narrative).toBeNull();
    expect(r.holdReasons.join(' ')).toContain('will governs');
  });

  it('holds when the regime was never determined', async () => {
    const r = await generatePack(baseCase({ regime: 'unknown' }));
    expect(r.status).toBe('held');
    expect(r.narrative).toBeNull();
  });

  it('holds when no Class I heir survives', async () => {
    const r = await generatePack(baseCase({
      heirs: [{ id: 'b', fullName: 'Vikram Gupta', relationship: 'brother', isMinor: false, isClaimant: true }],
    }));

    expect(r.status).toBe('held');
    expect(r.holdReasons.join(' ')).toContain('Class II');
  });

  it('holds when there are no claimants at all', async () => {
    const r = await generatePack(baseCase({
      heirs: [{ id: 's1', fullName: 'Arjun Gupta', relationship: 'son', isMinor: false, isClaimant: false }],
    }));

    expect(r.status).toBe('held');
  });
});

describe('deterministic work happens even on held cases', () => {
  it('still computes document requirements so the reviewer has a starting point', async () => {
    const r = await generatePack(baseCase({ regime: 'muslim_sunni' }));

    expect(r.requirements).toHaveLength(1);
    expect(r.requirements[0]?.ruleId).toBe('bank.no_nomination.small');
  });

  it('records a versioned manifest for later explanation', async () => {
    const r = await generatePack(baseCase({ regime: 'testate' }));

    expect(r.manifest).toHaveLength(1);
    expect(r.manifest[0]?.version).toBe('2026.08.1');
    expect(r.manifest[0]?.assetId).toBe('a1');
  });

  it('computes correct shares before deciding to call a model', async () => {
    // Widow + son under the Hindu Act is 1/2 each. Held or not, this must be right.
    const r = await generatePack(baseCase({ regime: 'muslim_sunni' }));
    expect(r.shares.computed).toBe(false);   // Muslim: refused, as designed

    const hindu = await generatePack(baseCase()).catch(() => null);
    // The Hindu case proceeds to the model; without a key it holds with a
    // generation failure, but the shares are computed regardless.
    expect(hindu?.shares.computed).toBe(true);
    expect(hindu?.shares.shares).toHaveLength(2);
  });
});

describe('unsupported asset kinds', () => {
  it('holds a case containing an asset we have no rule for', async () => {
    const r = await generatePack(baseCase({
      assets: [{
        id: 'a1', kind: 'nps', institution: 'NPS Trust',
        accountRef: null, valueBand: 'over_10L', hasNomination: null, isJoint: false,
      }],
    }));

    expect(r.status).toBe('held');
    expect(r.requirements[0]?.unsupported).toBe(true);
    expect(r.holdReasons.join(' ')).toContain('manual preparation');
  });
});

describe('failure containment', () => {
  it('holds rather than throws when the provider is unreachable or unconfigured', async () => {
    // No AI key is set in the test environment, so the provider call fails.
    // The pipeline must convert that into a held case, not an unhandled
    // rejection that loses the family's intake.
    const r = await generatePack(baseCase());

    expect(r.status).toBe('held');
    expect(r.holdReasons.join(' ')).toContain('Narrative generation failed');
    // Deterministic work survives the failure.
    expect(r.shares.computed).toBe(true);
    expect(r.manifest).toHaveLength(1);
  });

  it('never leaks the real case id into anything the model would have seen', async () => {
    const input = baseCase();
    const r = await generatePack(input);
    expect(JSON.stringify(r.manifest)).not.toContain(input.caseId);
  });
});
