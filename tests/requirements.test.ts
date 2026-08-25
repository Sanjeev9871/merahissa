import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import {
  requirementsFor, blocksAutoGeneration, buildManifest, ruleSets,
  type AssetFacts,
} from '../src/lib/requirements.ts';

const FRESH = new Date('2026-09-01');   // before every verifyBy in the table
const STALE = new Date('2027-06-01');   // after every verifyBy in the table

const asset = (over: Partial<AssetFacts> = {}): AssetFacts => ({
  id: 'a1', kind: 'bank_deposit', valueBand: 'under_1L', hasNomination: false, ...over,
});

const codes = (r: ReturnType<typeof requirementsFor>) => r.requirements.map((x) => x.code);

describe('bank deposits', () => {
  it('uses the simple nominee path when a nomination exists', () => {
    const r = requirementsFor(asset({ hasNomination: true }), FRESH);
    expect(r.ruleId).toBe('bank.nominated');
    expect(codes(r)).toContain('nominee_claim_form');
    expect(codes(r)).not.toContain('succession_certificate');
  });

  it('recommends an heirship affidavit even to a nominee', () => {
    // Because a nominee holds as trustee, not owner (Shakti Yezdani, 2023).
    const r = requirementsFor(asset({ hasNomination: true }), FRESH);
    const aff = r.requirements.find((x) => x.code === 'affidavit_of_heirship');
    expect(aff?.mandatory).toBe(false);
    expect(aff?.note).toContain('co-heirs');
  });

  it('uses the indemnity path for small unnominated balances', () => {
    const r = requirementsFor(asset({ valueBand: 'under_1L' }), FRESH);
    expect(r.ruleId).toBe('bank.no_nomination.small');
    expect(codes(r)).toContain('indemnity_bond');
    expect(codes(r)).not.toContain('succession_certificate');
  });

  it('escalates to a succession certificate above the threshold', () => {
    const r = requirementsFor(asset({ valueBand: 'over_10L' }), FRESH);
    expect(r.ruleId).toBe('bank.no_nomination.large');
    expect(codes(r)).toContain('succession_certificate');
  });

  it('treats an unknown value as large and says why', () => {
    // Erring toward more documentation costs time; erring toward less costs
    // a rejected filing and months of delay.
    const r = requirementsFor(asset({ valueBand: 'unknown' }), FRESH);
    expect(r.ruleId).toBe('bank.no_nomination.large');
    expect(r.notes.join(' ')).toContain('more demanding');
  });

  it('assumes no nomination when the field was never recorded', () => {
    const r = requirementsFor(asset({ hasNomination: null }), FRESH);
    expect(r.ruleId).toBe('bank.no_nomination.small');
    expect(r.notes.join(' ')).toContain('assumed absent');
  });
});

describe('other asset kinds', () => {
  it('routes IEPF claims through Form 5 and the entitlement letter', () => {
    const r = requirementsFor(asset({ kind: 'iepf_shares' }), FRESH);
    expect(r.ruleId).toBe('iepf.claim');
    expect(codes(r)).toContain('iepf_form_5');
    expect(codes(r)).toContain('iepf_entitlement_letter');
  });

  it('routes demat, mutual fund, insurance and EPF to their own rule sets', () => {
    expect(requirementsFor(asset({ kind: 'demat_shares' }), FRESH).ruleId).toBe('demat.transmission');
    expect(requirementsFor(asset({ kind: 'mutual_fund' }), FRESH).ruleId).toBe('mf.transmission');
    expect(requirementsFor(asset({ kind: 'insurance_policy' }), FRESH).ruleId).toBe('insurance.death_claim');
    expect(requirementsFor(asset({ kind: 'epf' }), FRESH).ruleId).toBe('epf.death_claim');
  });

  it('always includes the death certificate and claimant KYC', () => {
    for (const kind of ['bank_deposit', 'demat_shares', 'iepf_shares', 'mutual_fund', 'epf'] as const) {
      const c = codes(requirementsFor(asset({ kind }), FRESH));
      expect(c).toContain('death_certificate');
      expect(c).toContain('claimant_kyc');
    }
  });

  it('marks uncovered asset kinds unsupported rather than guessing', () => {
    for (const kind of ['ppf', 'nps', 'safe_deposit', 'other'] as const) {
      const r = requirementsFor(asset({ kind }), FRESH);
      expect(r.unsupported).toBe(true);
      expect(r.requirements).toEqual([]);
      expect(r.notes.join(' ')).toContain('held for manual preparation');
    }
  });
});

describe('staleness — the guard against silently out-of-date templates', () => {
  it('does not flag rules inside their review window', () => {
    expect(requirementsFor(asset(), FRESH).stale).toBe(false);
  });

  it('flags every rule once past its verifyBy date', () => {
    const r = requirementsFor(asset(), STALE);
    expect(r.stale).toBe(true);
    expect(r.notes.join(' ')).toContain('review date');
  });

  it('blocks auto-generation when any asset is stale', () => {
    const results = [requirementsFor(asset(), FRESH), requirementsFor(asset({ id: 'a2' }), STALE)];
    expect(blocksAutoGeneration(results)).toBe(true);
  });

  it('blocks auto-generation when any asset is unsupported', () => {
    const results = [requirementsFor(asset({ id: 'a2', kind: 'nps' }), FRESH)];
    expect(blocksAutoGeneration(results)).toBe(true);
  });

  it('permits generation when every asset is fresh and supported', () => {
    const results = [
      requirementsFor(asset(), FRESH),
      requirementsFor(asset({ id: 'a2', kind: 'mutual_fund' }), FRESH),
    ];
    expect(blocksAutoGeneration(results)).toBe(false);
  });
});

describe('manifest', () => {
  it('records rule id and version per asset for later explanation', () => {
    const results = [requirementsFor(asset(), FRESH)];
    const m = buildManifest(results);
    expect(m).toHaveLength(1);
    expect(m[0]?.ruleId).toBe('bank.no_nomination.small');
    expect(m[0]?.version).toBe('2026.08.1');
  });

  it('omits unsupported assets, which have no rule to record', () => {
    expect(buildManifest([requirementsFor(asset({ kind: 'nps' }), FRESH)])).toEqual([]);
  });
});

describe('rule table hygiene', () => {
  it('gives every rule a version, a source note and a review date', () => {
    for (const r of ruleSets()) {
      expect(r.version.length > 0).toBe(true);
      expect(r.sourceNote.length > 20).toBe(true);
      expect(Number.isNaN(new Date(r.verifyBy).getTime())).toBe(false);
      expect(new Date(r.verifyBy) > new Date(r.effectiveFrom)).toBe(true);
    }
  });

  it('has no duplicate rule ids', () => {
    const ids = ruleSets().map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks court-process documents with a referral note', () => {
    const large = ruleSets().find((r) => r.id === 'bank.no_nomination.large')!;
    const sc = large.requirements.find((x) => x.code === 'succession_certificate');
    expect(sc?.note).toContain('refer out');
  });
});
