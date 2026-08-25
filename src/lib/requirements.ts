import type { AssetKind, ValueBand } from './redaction';

/**
 * Document requirements engine.
 *
 * DESIGN RULE: requirements are DATA, not logic.
 *
 * The single biggest risk in this product is not a software bug — it is
 * telling a family that SBI needs form X when SBI changed to form Y in
 * March. Institution requirements drift constantly and there is no
 * authoritative machine-readable source for them.
 *
 * So every rule below carries:
 *   - a `version` and `effectiveFrom`, so a pack generated in March can be
 *     explained in December,
 *   - a `sourceNote` naming where the requirement came from,
 *   - a `verifyBy` date after which the rule is considered stale and cases
 *     touching it are held for review rather than auto-generated.
 *
 * That last field is the important one. It converts "our templates might be
 * out of date" from an invisible risk into a loud, dated, blocking one.
 *
 * The advocate's quarterly review is a review of THIS FILE.
 */

export type DocumentCode =
  | 'death_certificate'
  | 'claimant_kyc'
  | 'bank_transmission_form'
  | 'nominee_claim_form'
  | 'indemnity_bond'
  | 'affidavit_of_heirship'
  | 'noc_from_co_heirs'
  | 'surety_undertaking'
  | 'succession_certificate'
  | 'legal_heir_certificate'
  | 'demat_trf'
  | 'iepf_form_5'
  | 'iepf_entitlement_letter'
  | 'mf_transmission_form'
  | 'insurance_claim_form'
  | 'epf_form_20'
  | 'epf_form_5if'
  | 'cancelled_cheque'
  | 'will_probate';

export interface Requirement {
  code: DocumentCode;
  label: string;
  /** True where the institution will refuse the claim without it. */
  mandatory: boolean;
  note?: string;
}

export interface RuleSet {
  id: string;
  version: string;
  effectiveFrom: string;
  /** After this date the rule is stale; cases using it are held for review. */
  verifyBy: string;
  sourceNote: string;
  requirements: Requirement[];
}

const BASE: Requirement[] = [
  { code: 'death_certificate', label: 'Death certificate (original or attested copy)', mandatory: true },
  { code: 'claimant_kyc', label: 'Claimant PAN and address proof', mandatory: true },
];

/**
 * Value bands, not exact balances. Thresholds are what drive documentation,
 * and a band is far less sensitive to hold than a balance.
 */
function bandAtOrAbove(band: ValueBand, threshold: ValueBand): boolean {
  const order: ValueBand[] = ['under_1L', '1L_to_5L', '5L_to_10L', 'over_10L'];
  const b = order.indexOf(band);
  const t = order.indexOf(threshold);
  if (b === -1 || t === -1) return false;   // 'unknown' never satisfies a threshold
  return b >= t;
}

// ---------------------------------------------------------------------------
// Rule sets
//
// verifyBy dates are deliberately short. These are starting points drafted
// from public guidance and MUST be confirmed against each institution's
// current forms by an advocate before the first real filing.
// ---------------------------------------------------------------------------

const RULES: RuleSet[] = [
  {
    id: 'bank.nominated',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote:
      'Banking Regulation Act s.45ZA and standard bank nominee procedure. ' +
      'Where a valid nomination exists the bank pays the nominee as trustee ' +
      'for the estate — note Shakti Yezdani v Jayanand Salgaonkar (SC, 2023): ' +
      'a nominee holds, but does not own.',
    requirements: [
      ...BASE,
      { code: 'nominee_claim_form', label: 'Bank nominee claim form', mandatory: true },
      {
        code: 'affidavit_of_heirship', label: 'Affidavit recording heirs', mandatory: false,
        note: 'Not required by the bank, but protects the nominee against later ' +
              'claims by co-heirs given the nominee-is-not-owner rule.',
      },
    ],
  },
  {
    id: 'bank.no_nomination.small',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote:
      'Most public sector banks settle small balances without a succession ' +
      'certificate against an indemnity bond and surety. Thresholds are ' +
      'bank-specific and MUST be confirmed per institution.',
    requirements: [
      ...BASE,
      { code: 'bank_transmission_form', label: 'Claim form for deceased depositor account', mandatory: true },
      { code: 'indemnity_bond', label: 'Indemnity bond on stamp paper', mandatory: true },
      { code: 'affidavit_of_heirship', label: 'Affidavit of heirship', mandatory: true },
      { code: 'noc_from_co_heirs', label: 'No-objection certificate from every other legal heir', mandatory: true },
      { code: 'surety_undertaking', label: 'Surety undertaking from two persons of means', mandatory: false,
        note: 'Required by several banks above their no-surety limit.' },
    ],
  },
  {
    id: 'bank.no_nomination.large',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote:
      'Above the bank\'s internal limit a succession certificate under ' +
      'Indian Succession Act ss.370-390, or a legal heir certificate where ' +
      'the bank accepts one, is generally insisted upon.',
    requirements: [
      ...BASE,
      { code: 'bank_transmission_form', label: 'Claim form for deceased depositor account', mandatory: true },
      { code: 'succession_certificate', label: 'Succession certificate (ISA ss.370-390)', mandatory: true,
        note: 'Court process. Requires advocate representation — refer out.' },
      { code: 'legal_heir_certificate', label: 'Legal heir certificate (where the bank accepts one in lieu)', mandatory: false },
    ],
  },
  {
    id: 'demat.transmission',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote:
      'SEBI operating guidelines on transmission of securities. Simplified ' +
      'documentation applies below a prescribed per-company threshold; the ' +
      'current figure MUST be confirmed against the latest SEBI circular.',
    requirements: [
      ...BASE,
      { code: 'demat_trf', label: 'Transmission request form (TRF) to the DP', mandatory: true },
      { code: 'affidavit_of_heirship', label: 'Affidavit of legal heirship', mandatory: true },
      { code: 'noc_from_co_heirs', label: 'NOC from other legal heirs', mandatory: true },
      { code: 'indemnity_bond', label: 'Indemnity bond', mandatory: true },
    ],
  },
  {
    id: 'iepf.claim',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote:
      'IEPF Authority (Accounting, Audit, Transfer and Refund) Rules 2016. ' +
      'Claim is made in Form IEPF-5 online, then a physical pack goes to the ' +
      'company nodal officer, who issues an entitlement letter.',
    requirements: [
      ...BASE,
      { code: 'iepf_form_5', label: 'Form IEPF-5 (filed online, acknowledgement printed)', mandatory: true },
      { code: 'iepf_entitlement_letter', label: 'Entitlement letter from the company nodal officer', mandatory: true,
        note: 'Obtained after the company verifies the physical pack. This is ' +
              'the step families most often stall on.' },
      { code: 'indemnity_bond', label: 'Indemnity bond on stamp paper', mandatory: true },
      { code: 'affidavit_of_heirship', label: 'Affidavit', mandatory: true },
      { code: 'cancelled_cheque', label: 'Cancelled cheque of the claimant\'s Aadhaar-linked account', mandatory: true },
    ],
  },
  {
    id: 'mf.transmission',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote: 'AMFI standard transmission forms, processed through CAMS/KFintech.',
    requirements: [
      ...BASE,
      { code: 'mf_transmission_form', label: 'Transmission request form (T3 where no nomination)', mandatory: true },
      { code: 'cancelled_cheque', label: 'Cancelled cheque of the claimant\'s bank account', mandatory: true },
      { code: 'noc_from_co_heirs', label: 'NOC from other legal heirs (where no nomination)', mandatory: false },
    ],
  },
  {
    id: 'insurance.death_claim',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote: 'IRDAI standard death-claim documentation.',
    requirements: [
      ...BASE,
      { code: 'insurance_claim_form', label: 'Death claim form with original policy document', mandatory: true },
      { code: 'cancelled_cheque', label: 'Cancelled cheque of the claimant', mandatory: true },
    ],
  },
  {
    id: 'epf.death_claim',
    version: '2026.08.1',
    effectiveFrom: '2026-08-01',
    verifyBy: '2026-11-30',
    sourceNote:
      'EPFO composite claim on death. Note the Employees\' Provident Funds ' +
      'Scheme 2026 (gazetted 29 June 2026) restructured withdrawal grounds; ' +
      'form numbering MUST be re-checked against the new scheme.',
    requirements: [
      ...BASE,
      { code: 'epf_form_20', label: 'Form 20 (PF final settlement on death)', mandatory: true },
      { code: 'epf_form_5if', label: 'Form 5(IF) (EDLI assurance benefit)', mandatory: false },
      { code: 'cancelled_cheque', label: 'Cancelled cheque of the claimant', mandatory: true },
    ],
  },
];

const RULE_BY_ID = new Map(RULES.map((r) => [r.id, r]));

// ---------------------------------------------------------------------------

export interface AssetFacts {
  id: string;
  kind: AssetKind;
  valueBand: ValueBand;
  hasNomination?: boolean | null;
}

export interface RequirementResult {
  assetId: string;
  ruleId: string;
  ruleVersion: string;
  requirements: Requirement[];
  /** Rule is past its verifyBy date — hold the case, do not auto-generate. */
  stale: boolean;
  /** No rule matched this asset kind. */
  unsupported: boolean;
  notes: string[];
}

function pickRuleId(a: AssetFacts): string | null {
  switch (a.kind) {
    case 'bank_deposit':
    case 'post_office':
      if (a.hasNomination === true) return 'bank.nominated';
      // Unknown value is treated as large. Erring toward MORE documentation
      // wastes a family's time; erring toward less wastes a rejected filing.
      return bandAtOrAbove(a.valueBand, '5L_to_10L') || a.valueBand === 'unknown'
        ? 'bank.no_nomination.large'
        : 'bank.no_nomination.small';
    case 'demat_shares':      return 'demat.transmission';
    case 'iepf_shares':       return 'iepf.claim';
    case 'mutual_fund':       return 'mf.transmission';
    case 'insurance_policy':  return 'insurance.death_claim';
    case 'epf':               return 'epf.death_claim';
    case 'ppf':
    case 'nps':
    case 'safe_deposit':
    case 'other':
    default:                  return null;
  }
}

export function requirementsFor(
  asset: AssetFacts,
  today: Date = new Date(),
): RequirementResult {
  const ruleId = pickRuleId(asset);

  if (!ruleId) {
    return {
      assetId: asset.id, ruleId: 'none', ruleVersion: '-',
      requirements: [], stale: false, unsupported: true,
      notes: [
        `No rule set covers asset kind "${asset.kind}". This asset is held for ` +
        'manual preparation rather than auto-generated.',
      ],
    };
  }

  const rule = RULE_BY_ID.get(ruleId)!;
  const notes: string[] = [];
  const stale = new Date(rule.verifyBy) < today;

  if (stale) {
    notes.push(
      `Rule set "${rule.id}" (v${rule.version}) passed its review date of ` +
      `${rule.verifyBy}. Held for advocate re-verification before generation.`,
    );
  }
  if (asset.valueBand === 'unknown') {
    notes.push(
      'Asset value band is unknown, so the more demanding documentation path ' +
      'was assumed. Confirming the balance may reduce what is required.',
    );
  }
  if (asset.hasNomination == null && (asset.kind === 'bank_deposit' || asset.kind === 'post_office')) {
    notes.push('Nomination status was not recorded; assumed absent.');
  }

  return {
    assetId: asset.id,
    ruleId: rule.id,
    ruleVersion: rule.version,
    requirements: rule.requirements,
    stale,
    unsupported: false,
    notes,
  };
}

/** Build the manifest stored on packs.template_manifest for auditability. */
export function buildManifest(
  results: RequirementResult[],
): Array<{ ruleId: string; version: string; assetId: string }> {
  return results
    .filter((r) => !r.unsupported)
    .map((r) => ({ ruleId: r.ruleId, version: r.ruleVersion, assetId: r.assetId }));
}

/** A case is blocked from auto-generation if any asset is stale or unsupported. */
export function blocksAutoGeneration(results: RequirementResult[]): boolean {
  return results.some((r) => r.stale || r.unsupported);
}

/** Exposed so the admin dashboard can show what needs re-verification. */
export function ruleSets(): readonly RuleSet[] {
  return RULES;
}
