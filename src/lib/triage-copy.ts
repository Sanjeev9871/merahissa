/**
 * Triage wizard copy.
 *
 * Kept out of the component so the wizard's logic and its words stay separable
 * — the share computation and document rules live in shared code, and this file
 * only names things for the reader.
 */

export interface TriageCopy {
  title: string;
  intro: string;
  progress: string;
  stepOf: (n: number, of: number) => string;
  q0: string; q0hint: string;
  wasFemale: string; wasFemaleHint: string;
  q1: string; q1hint: string;
  relative: (i: number) => string;
  remove: string; addRelative: string;
  q2: string; q2hint: string;
  q3: string; q3hint: string;
  nomYes: string; nomNo: string; nomUnsure: string;
  back: string; cont: string;
  sumTitle: string;
  advocateTitle: string; advocateBody: string;
  sharesLabel: string; docsLabel: string;
  courtTitle: string; courtBody: string;
  unsupported: string;
  nothingSent: string; nothingSentBody: string;
  prepare: string;
  intakeHref: string;
}

export const TRIAGE_COPY: TriageCopy = {
  title: 'What does your case need?',
  intro:
    'Six questions. Nothing you enter here leaves your device. This page sends nothing to us, '
    + 'and we never ask for a name.',
  progress: 'Progress',
  stepOf: (n, of) => `Step ${n} of ${of}`,
  q0: 'Which community’s succession law applies?',
  q0hint:
    'In India this follows the community of the person who has died, unless they left a valid will.',
  wasFemale: 'This was a woman',
  wasFemaleHint:
    'The Hindu Succession Act uses different rules for women, so this changes the answer.',
  q1: 'Who is in the family?',
  q1hint: 'Add each surviving close relative. No names here — just how they were related.',
  relative: (i) => `Relative ${i}`,
  remove: 'Remove',
  addRelative: 'Add another relative',
  q2: 'What did they hold?',
  q2hint: 'Select everything that applies.',
  q3: 'Was a nominee registered?',
  q3hint:
    'A registered nominee makes bank and fund claims considerably simpler. If you are not sure, '
    + 'say so — we will assume there was none.',
  nomYes: 'Yes, on most accounts',
  nomNo: 'No',
  nomUnsure: 'Not sure',
  back: 'Back',
  cont: 'Continue',
  sumTitle: 'Here is what your case involves',
  advocateTitle: 'Your case needs a lawyer, not just paperwork.',
  advocateBody:
    'We would rather tell you now than take your money first. We can introduce you to an '
    + 'advocate who handles these.',
  sharesLabel: 'Shares, under the law that applies to you:',
  docsLabel: 'Documents you will need:',
  courtTitle: 'At least one asset will need a succession certificate.',
  courtBody:
    'That is a court application under the Indian Succession Act and typically takes six months '
    + 'or more. We prepare everything around it, but an advocate must file it.',
  unsupported:
    'Some of what you listed (PPF, NPS or a locker) we handle manually rather than '
    + 'automatically. We will confirm the steps for those with you directly.',
  nothingSent: 'Nothing here has been sent to us.',
  nothingSentBody:
    'This page ran entirely in your browser. If you would like us to prepare these documents, '
    + 'the next step creates an account and asks for the details we actually need.',
  prepare: 'Prepare these documents for me',
  intakeHref: '/intake',
};

/** Relationship labels shown in the wizard's dropdowns. */
export const REL_LABELS: Record<string, string> = {
  spouse: 'Wife or husband', son: 'Son', daughter: 'Daughter',
  mother: 'Mother', father: 'Father', brother: 'Brother', sister: 'Sister',
  grandson: 'Grandson', granddaughter: 'Granddaughter', other: 'Someone else',
};

export const REGIME_LABELS: Record<string, string> = {
  hindu: 'Hindu, Sikh, Jain or Buddhist',
  muslim_sunni: 'Muslim (Sunni)', muslim_shia: 'Muslim (Shia)',
  christian: 'Christian', parsi: 'Parsi',
  testate: 'There is a will', unknown: 'Not sure',
};

export const ASSET_LABELS: Record<string, string> = {
  bank_deposit: 'Bank account or fixed deposit',
  demat_shares: 'Shares in a demat account',
  iepf_shares: 'Old shares transferred to the IEPF',
  mutual_fund: 'Mutual funds',
  insurance_policy: 'Life insurance policy',
  epf: 'Provident fund (EPF)',
  ppf: 'PPF account',
  nps: 'National Pension System',
  post_office: 'Post office savings',
  safe_deposit: 'Bank locker',
  other: 'Something else',
};
