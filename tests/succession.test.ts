import { describe, it } from 'node:test';
import { expect } from './expect.ts';
import {
  computeShares, fractionToString, sharesSumToOne, reduce,
  type Heir,
} from '../src/lib/succession.ts';

const h = (id: string, relationship: Heir['relationship']): Heir =>
  ({ id, relationship, isClaimant: true });

const shareOf = (r: ReturnType<typeof computeShares>, id: string) => {
  const s = r.shares.find((x) => x.heirId === id);
  return s ? fractionToString(s.share) : undefined;
};

describe('fraction helpers', () => {
  it('reduces to lowest terms', () => {
    expect(reduce({ num: 4, den: 8 })).toEqual({ num: 1, den: 2 });
    expect(reduce({ num: 6, den: 3 })).toEqual({ num: 2, den: 1 });
  });

  it('detects share tables that do not total one', () => {
    expect(sharesSumToOne([{ num: 1, den: 3 }, { num: 2, den: 3 }])).toBe(true);
    expect(sharesSumToOne([{ num: 1, den: 3 }, { num: 1, den: 3 }])).toBe(false);
    expect(sharesSumToOne([{ num: 1, den: 3 }, { num: 1, den: 3 }, { num: 1, den: 3 }])).toBe(true);
  });
});

describe('Hindu male intestate — s.8, s.10', () => {
  it('splits equally between widow, two children and mother', () => {
    const r = computeShares('hindu', [
      h('w', 'spouse'), h('s1', 'son'), h('d1', 'daughter'), h('m', 'mother'),
    ]);

    expect(r.computed).toBe(true);
    // Four units: widow 1, son 1, daughter 1, mother 1.
    expect(shareOf(r, 'w')).toBe('1/4');
    expect(shareOf(r, 's1')).toBe('1/4');
    expect(shareOf(r, 'd1')).toBe('1/4');
    expect(shareOf(r, 'm')).toBe('1/4');
  });

  it('gives sons and daughters identical shares', () => {
    const r = computeShares('hindu', [h('s1', 'son'), h('d1', 'daughter')]);
    expect(shareOf(r, 's1')).toBe('1/2');
    expect(shareOf(r, 'd1')).toBe('1/2');
  });

  it('makes multiple widows share ONE share between them, not one each', () => {
    // The classic error. Two widows + one son is 1/4, 1/4, 1/2 — not 1/3 each.
    const r = computeShares('hindu', [
      h('w1', 'spouse'), h('w2', 'spouse'), h('s1', 'son'),
    ]);

    expect(shareOf(r, 'w1')).toBe('1/4');
    expect(shareOf(r, 'w2')).toBe('1/4');
    expect(shareOf(r, 's1')).toBe('1/2');
    expect(sharesSumToOne(r.shares.map((s) => s.share))).toBe(true);
  });

  it('excludes non-Class-I heirs and says so', () => {
    const r = computeShares('hindu', [
      h('w', 'spouse'), h('s1', 'son'), h('b1', 'brother'), h('f', 'father'),
    ]);

    expect(shareOf(r, 'w')).toBe('1/2');
    expect(shareOf(r, 's1')).toBe('1/2');
    expect(shareOf(r, 'b1')).toBeUndefined();
    expect(shareOf(r, 'f')).toBeUndefined();   // father is Class II, not Class I
    expect(r.notes.join(' ')).toContain('not Class I');
  });

  it('refers to an advocate when no Class I heir survives', () => {
    const r = computeShares('hindu', [h('b1', 'brother'), h('f', 'father')]);
    expect(r.computed).toBe(false);
    expect(r.requiresAdvocate).toBe(true);
    expect(r.advocateReason).toContain('Class II');
  });

  it('flags the 2005 coparcenary amendment when a daughter claims', () => {
    const r = computeShares('hindu', [h('d1', 'daughter')]);
    expect(r.notes.join(' ')).toContain('Vineeta Sharma');
  });
});

describe('Hindu female intestate — s.15', () => {
  it('splits equally between husband and children', () => {
    const r = computeShares('hindu',
      [h('hus', 'spouse'), h('s1', 'son'), h('d1', 'daughter')],
      { deceasedWasFemale: true });

    expect(shareOf(r, 'hus')).toBe('1/3');
    expect(shareOf(r, 's1')).toBe('1/3');
    expect(shareOf(r, 'd1')).toBe('1/3');
  });

  it('always warns about s.15(2) reverse devolution', () => {
    const r = computeShares('hindu', [h('s1', 'son')], { deceasedWasFemale: true });
    expect(r.notes.join(' ')).toContain('s.15(2)');
  });

  it('refers out when only remoter heirs survive', () => {
    const r = computeShares('hindu', [h('m', 'mother')], { deceasedWasFemale: true });
    expect(r.requiresAdvocate).toBe(true);
  });
});

describe('Christian intestate — Indian Succession Act 1925, s.33', () => {
  it('gives the spouse one-third where there are lineal descendants', () => {
    const r = computeShares('christian', [
      h('w', 'spouse'), h('s1', 'son'), h('d1', 'daughter'),
    ]);

    expect(shareOf(r, 'w')).toBe('1/3');
    expect(shareOf(r, 's1')).toBe('1/3');   // two-thirds split between two children
    expect(shareOf(r, 'd1')).toBe('1/3');
  });

  it('gives the spouse one-half where there are kindred but no descendants', () => {
    const r = computeShares('christian', [h('w', 'spouse'), h('m', 'mother')]);
    expect(shareOf(r, 'w')).toBe('1/2');
    expect(shareOf(r, 'm')).toBe('1/2');
  });

  it('gives the spouse everything where there is neither', () => {
    const r = computeShares('christian', [h('w', 'spouse')]);
    expect(shareOf(r, 'w')).toBe('1');
  });

  it('splits among descendants where there is no spouse', () => {
    const r = computeShares('christian', [h('s1', 'son'), h('s2', 'son'), h('d1', 'daughter')]);
    expect(shareOf(r, 's1')).toBe('1/3');
    expect(shareOf(r, 'd1')).toBe('1/3');
  });
});

describe('Parsi intestate — Indian Succession Act 1925, s.51', () => {
  it('gives spouse and children equal shares, parents half a share', () => {
    // spouse + 2 children = 3 full units = 6 halves; +1 parent = 7 halves.
    const r = computeShares('parsi', [
      h('w', 'spouse'), h('s1', 'son'), h('d1', 'daughter'), h('m', 'mother'),
    ]);

    expect(shareOf(r, 'w')).toBe('2/7');
    expect(shareOf(r, 's1')).toBe('2/7');
    expect(shareOf(r, 'd1')).toBe('2/7');
    expect(shareOf(r, 'm')).toBe('1/7');
    expect(sharesSumToOne(r.shares.map((s) => s.share))).toBe(true);
  });

  it('treats sons and daughters identically post-1991', () => {
    const r = computeShares('parsi', [h('s1', 'son'), h('d1', 'daughter')]);
    expect(shareOf(r, 's1')).toBe(shareOf(r, 'd1'));
  });
});

describe('cases we deliberately refuse to compute', () => {
  for (const regime of ['muslim_sunni', 'muslim_shia'] as const) it(`routes ${regime} to an advocate`, () => {
    const r = computeShares(regime, [h('w', 'spouse'), h('s1', 'son')]);
    expect(r.computed).toBe(false);
    expect(r.requiresAdvocate).toBe(true);
    expect(r.shares).toEqual([]);
    expect(r.advocateReason).toContain('Quranic');
  });

  it('routes testate cases to an advocate', () => {
    const r = computeShares('testate', [h('w', 'spouse')]);
    expect(r.requiresAdvocate).toBe(true);
    expect(r.advocateReason).toContain('will governs');
  });

  it('refuses when the regime is undetermined', () => {
    expect(computeShares('unknown', [h('w', 'spouse')]).requiresAdvocate).toBe(true);
  });

  it('refuses when there are no claimants', () => {
    const r = computeShares('hindu', [{ id: 'x', relationship: 'son', isClaimant: false }]);
    expect(r.requiresAdvocate).toBe(true);
  });
});

describe('invariant: every computed result sums to exactly one', () => {
  const scenarios: Array<[string, Parameters<typeof computeShares>]> = [
    ['hindu widow+3 children', ['hindu', [h('w', 'spouse'), h('s1', 'son'), h('s2', 'son'), h('d1', 'daughter')]]],
    ['hindu 3 widows+2 children', ['hindu', [h('w1', 'spouse'), h('w2', 'spouse'), h('w3', 'spouse'), h('s1', 'son'), h('d1', 'daughter')]]],
    ['hindu mother only', ['hindu', [h('m', 'mother')]]],
    ['christian spouse+5 children', ['christian', [h('w', 'spouse'), h('c1', 'son'), h('c2', 'son'), h('c3', 'son'), h('c4', 'daughter'), h('c5', 'daughter')]]],
    ['parsi spouse+3 children+2 parents', ['parsi', [h('w', 'spouse'), h('c1', 'son'), h('c2', 'daughter'), h('c3', 'son'), h('m', 'mother'), h('f', 'father')]]],
  ];

  for (const [label, args] of scenarios) it(label, () => {
    const r = computeShares(...args);
    expect(r.computed).toBe(true);
    expect(sharesSumToOne(r.shares.map((s) => s.share))).toBe(true);
  });
});
