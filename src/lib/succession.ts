/**
 * Succession share computation.
 *
 * DESIGN RULE: this module contains no AI. Intestate shares are a matter of
 * statute, and a language model that is right 95% of the time is unacceptable
 * when the output is what a family tells a bank their entitlement is. Every
 * share here is computed by code, traceable to a cited section, and expressed
 * as an exact integer fraction — never a float, because 1/3 must stay 1/3.
 *
 * The model's role is downstream: turning this deterministic result into
 * readable covering letters and affidavit prose.
 *
 * WHERE WE REFUSE TO COMPUTE: Muslim intestate succession (Sunni and Shia)
 * involves Quranic sharers, residuaries, doctrines of `awl` and `radd`, and
 * school-specific rules on exclusion. It is genuinely beyond safe automation
 * and we route those cases to an advocate rather than guessing. Testate cases
 * likewise — the will governs, and reading a will is not a rules engine's job.
 */

export type Regime =
  | 'hindu' | 'muslim_sunni' | 'muslim_shia'
  | 'christian' | 'parsi' | 'testate' | 'unknown';

export type Relationship =
  | 'spouse' | 'son' | 'daughter' | 'mother' | 'father'
  | 'brother' | 'sister' | 'grandson' | 'granddaughter' | 'other';

export interface Heir {
  id: string;
  relationship: Relationship;
  isClaimant: boolean;
}

export interface Fraction { num: number; den: number }

export interface ShareResult {
  computed: boolean;
  shares: Array<{ heirId: string; share: Fraction; basis: string }>;
  /** Statutory provisions the computation rests on, for the covering letter. */
  authorities: string[];
  /** Non-fatal observations for the reviewer. */
  notes: string[];
  /** When true, the case must not be auto-generated. */
  requiresAdvocate: boolean;
  advocateReason?: string;
}

// ---------------------------------------------------------------------------
// Exact fraction arithmetic
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

export function reduce(f: Fraction): Fraction {
  const g = gcd(f.num, f.den);
  return { num: f.num / g, den: f.den / g };
}

export function fractionToString(f: Fraction): string {
  const r = reduce(f);
  return r.den === 1 ? `${r.num}` : `${r.num}/${r.den}`;
}

/** Guards against a rounding bug silently shipping shares that don't total 1. */
export function sharesSumToOne(shares: Fraction[]): boolean {
  if (shares.length === 0) return false;
  const den = shares.reduce((acc, s) => (acc * s.den) / gcd(acc, s.den), 1);
  const total = shares.reduce((acc, s) => acc + s.num * (den / s.den), 0);
  return total === den;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function computeShares(
  regime: Regime,
  heirs: Heir[],
  opts: { deceasedWasFemale?: boolean } = {},
): ShareResult {
  const claimants = heirs.filter((h) => h.isClaimant);

  if (claimants.length === 0) {
    return refuse('No claimant heirs were recorded, so no shares can be computed.');
  }

  switch (regime) {
    case 'hindu':
      return opts.deceasedWasFemale ? hinduFemale(claimants) : hinduMale(claimants);
    case 'christian':
      return christian(claimants);
    case 'parsi':
      return parsi(claimants);
    case 'muslim_sunni':
    case 'muslim_shia':
      return refuse(
        'Muslim intestate succession requires per-school computation of Quranic ' +
        'sharers and residuaries, including awl and radd. This is referred to an ' +
        'advocate rather than automated.',
      );
    case 'testate':
      return refuse(
        'A will governs distribution. The document pack is prepared from the ' +
        'will\'s terms after advocate review, not from intestate rules.',
      );
    default:
      return refuse('The applicable succession regime has not been determined.');
  }
}

function refuse(reason: string): ShareResult {
  return {
    computed: false, shares: [], authorities: [], notes: [],
    requiresAdvocate: true, advocateReason: reason,
  };
}

// ---------------------------------------------------------------------------
// Hindu Succession Act, 1956 — applies to Hindus, Buddhists, Jains and Sikhs
// ---------------------------------------------------------------------------

/**
 * Male intestate. Sections 8 and 10.
 *
 * Class I heirs take simultaneously and to the exclusion of all others. The
 * distribution rules in section 10 are per-capita among a defined set, with
 * one important wrinkle: multiple widows share ONE share between them, they
 * do not take one each.
 *
 * Note the 2005 amendment made daughters coparceners in ancestral property.
 * That affects the size of the estate, not the split of self-acquired
 * property, so it is surfaced as a note for the reviewer rather than folded
 * into the arithmetic here.
 */
function hinduMale(heirs: Heir[]): ShareResult {
  const widows = heirs.filter((h) => h.relationship === 'spouse');
  const children = heirs.filter((h) => h.relationship === 'son' || h.relationship === 'daughter');
  const mother = heirs.filter((h) => h.relationship === 'mother');

  const classOne = [...widows, ...children, ...mother];
  const excluded = heirs.filter((h) => !classOne.some((c) => c.id === h.id));

  if (classOne.length === 0) {
    return refuse(
      'No Class I heir is present. Succession then passes to Class II heirs, ' +
      'agnates and cognates under section 8, which is referred to an advocate.',
    );
  }

  // One share to the widows collectively, one to each child, one to the mother.
  const unitCount = (widows.length > 0 ? 1 : 0) + children.length + mother.length;

  const shares: ShareResult['shares'] = [];
  const notes: string[] = [];

  for (const w of widows) {
    shares.push({
      heirId: w.id,
      share: reduce({ num: 1, den: unitCount * widows.length }),
      basis: widows.length > 1
        ? `Widows take one share collectively (s.10 r.1), divided equally among ${widows.length}`
        : 'Widow takes one share (s.10 r.1)',
    });
  }
  for (const c of children) {
    shares.push({
      heirId: c.id,
      share: reduce({ num: 1, den: unitCount }),
      basis: `${c.relationship === 'son' ? 'Son' : 'Daughter'} takes one share (s.10 r.2)`,
    });
  }
  for (const m of mother) {
    shares.push({
      heirId: m.id,
      share: reduce({ num: 1, den: unitCount }),
      basis: 'Mother takes one share (s.10 r.2)',
    });
  }

  if (excluded.length > 0) {
    notes.push(
      `${excluded.length} recorded heir(s) are not Class I heirs and take nothing ` +
      'while a Class I heir survives (s.8). Confirm this is understood before filing.',
    );
  }
  if (children.some((c) => c.relationship === 'daughter')) {
    notes.push(
      'Daughters are coparceners in ancestral property by birth following the ' +
      'Hindu Succession (Amendment) Act 2005, confirmed in Vineeta Sharma v ' +
      'Rakesh Sharma (2020). That affects the extent of the estate, not this split.',
    );
  }

  return finalise(shares, notes, [
    'Hindu Succession Act, 1956, s.8 (general rules of succession for males)',
    'Hindu Succession Act, 1956, s.10 (distribution among Class I heirs)',
  ]);
}

/**
 * Female intestate. Section 15(1) read with section 16.
 *
 * Deliberately narrow: we compute only the first-entry case, where sons,
 * daughters and husband take equally. Sections 15(2)(a) and (b) reverse
 * devolution to the source of the property when it was inherited from parents
 * or from a husband, which depends on the provenance of each asset. That is a
 * fact question, not a rules question, so it goes to an advocate.
 */
function hinduFemale(heirs: Heir[]): ShareResult {
  const first = heirs.filter(
    (h) => h.relationship === 'son' || h.relationship === 'daughter' || h.relationship === 'spouse',
  );

  if (first.length === 0) {
    return refuse(
      'No heir in the first entry of s.15(1). Devolution then depends on whether ' +
      'the property was inherited from parents or from a husband (s.15(2)), which ' +
      'is a question of provenance and is referred to an advocate.',
    );
  }

  const shares = first.map((h) => ({
    heirId: h.id,
    share: reduce({ num: 1, den: first.length }),
    basis: 'Sons, daughters and husband take equally (s.15(1)(a) with s.16 r.1)',
  }));

  return finalise(shares, [
    'If any asset was inherited from the deceased\'s parents or husband, s.15(2) ' +
    'reverses devolution to that source and overrides this split. Confirm the ' +
    'provenance of each asset before filing.',
  ], [
    'Hindu Succession Act, 1956, s.15 (general rules of succession for females)',
    'Hindu Succession Act, 1956, s.16 (order of succession and manner of distribution)',
  ]);
}

// ---------------------------------------------------------------------------
// Indian Succession Act, 1925 — Christians (Part V)
// ---------------------------------------------------------------------------

/** Sections 33 and 33A. */
function christian(heirs: Heir[]): ShareResult {
  const spouse = heirs.filter((h) => h.relationship === 'spouse');
  const descendants = heirs.filter(
    (h) => ['son', 'daughter', 'grandson', 'granddaughter'].includes(h.relationship),
  );
  const kindred = heirs.filter(
    (h) => ['mother', 'father', 'brother', 'sister'].includes(h.relationship),
  );

  if (spouse.length > 1) {
    return refuse('More than one surviving spouse was recorded, which the Act does not contemplate.');
  }

  const shares: ShareResult['shares'] = [];
  const w = spouse[0];

  if (w && descendants.length > 0) {
    // Widow one-third, lineal descendants two-thirds between them.
    shares.push({ heirId: w.id, share: { num: 1, den: 3 }, basis: 'Spouse takes one-third (s.33(a))' });
    for (const d of descendants) {
      shares.push({
        heirId: d.id,
        share: reduce({ num: 2, den: 3 * descendants.length }),
        basis: 'Lineal descendants share two-thirds equally (s.33(a) with s.37)',
      });
    }
  } else if (w && kindred.length > 0) {
    shares.push({ heirId: w.id, share: { num: 1, den: 2 }, basis: 'Spouse takes one-half (s.33(b))' });
    for (const k of kindred) {
      shares.push({
        heirId: k.id,
        share: reduce({ num: 1, den: 2 * kindred.length }),
        basis: 'Kindred share one-half (s.33(b))',
      });
    }
  } else if (w) {
    shares.push({ heirId: w.id, share: { num: 1, den: 1 }, basis: 'Spouse takes the whole estate (s.33(c))' });
  } else if (descendants.length > 0) {
    for (const d of descendants) {
      shares.push({
        heirId: d.id,
        share: reduce({ num: 1, den: descendants.length }),
        basis: 'Lineal descendants take the whole estate equally (s.37)',
      });
    }
  } else {
    return refuse(
      'No spouse and no lineal descendants. Distribution among remoter kindred ' +
      'under ss.42–48 depends on degrees of relationship and is referred to an advocate.',
    );
  }

  return finalise(shares, [], [
    'Indian Succession Act, 1925, s.33 (division where there is a widow)',
    'Indian Succession Act, 1925, s.37 (distribution among lineal descendants)',
  ]);
}

// ---------------------------------------------------------------------------
// Indian Succession Act, 1925 — Parsis (Chapter III)
// ---------------------------------------------------------------------------

/**
 * Section 51 as amended in 1991, which equalised male and female shares.
 * Widow/widower and each child take equally; each surviving parent takes half
 * a child's share.
 */
function parsi(heirs: Heir[]): ShareResult {
  const spouse = heirs.filter((h) => h.relationship === 'spouse');
  const children = heirs.filter((h) => h.relationship === 'son' || h.relationship === 'daughter');
  const parents = heirs.filter((h) => h.relationship === 'mother' || h.relationship === 'father');

  if (spouse.length + children.length === 0) {
    return refuse(
      'No surviving spouse or child. Parsi intestate succession then follows ' +
      'Schedule II under ss.54–56 and is referred to an advocate.',
    );
  }

  // Work in half-units so a parent's half-share stays an integer.
  const fullUnits = spouse.length + children.length;
  const totalHalves = fullUnits * 2 + parents.length;

  const shares: ShareResult['shares'] = [
    ...spouse.map((h) => ({
      heirId: h.id,
      share: reduce({ num: 2, den: totalHalves }),
      basis: 'Surviving spouse takes a share equal to a child\'s (s.51(1))',
    })),
    ...children.map((h) => ({
      heirId: h.id,
      share: reduce({ num: 2, den: totalHalves }),
      basis: 'Each child takes an equal share (s.51(1), as amended 1991)',
    })),
    ...parents.map((h) => ({
      heirId: h.id,
      share: reduce({ num: 1, den: totalHalves }),
      basis: 'Each surviving parent takes half a child\'s share (s.51(2))',
    })),
  ];

  return finalise(shares, [], [
    'Indian Succession Act, 1925, s.51 (division of intestate\'s property among widow/widower, children and parents)',
    'Indian Succession Act (Amendment) Act, 1991',
  ]);
}

// ---------------------------------------------------------------------------

function finalise(
  shares: ShareResult['shares'],
  notes: string[],
  authorities: string[],
): ShareResult {
  // A share table that does not total exactly 1 is a bug, and it must stop the
  // case rather than reach a bank.
  if (!sharesSumToOne(shares.map((s) => s.share))) {
    return {
      computed: false, shares: [], authorities, notes,
      requiresAdvocate: true,
      advocateReason:
        'Internal check failed: computed shares do not sum to unity. This case is ' +
        'held for manual computation rather than filed.',
    };
  }

  return { computed: true, shares, authorities, notes, requiresAdvocate: false };
}
