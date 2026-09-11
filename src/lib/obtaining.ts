import type { SelfObtainedDocument } from './requirements.ts';

/**
 * How to obtain the documents we cannot prepare.
 *
 * Telling a family "you obtain this" and stopping there is only half an answer.
 * These are the other half: where to go, roughly how long it takes, roughly what
 * it costs, and the step that people most often get wrong.
 *
 * TWO RULES FOR THIS FILE.
 *
 * 1. It is general information, not legal advice, and every entry says where it
 *    varies. Registration and revenue procedure in India is state subject matter
 *    in practice — the governing Act is national, the form, the fee, the portal
 *    and the office are not. An entry that reads as though there is one national
 *    process would be actively misleading, so each carries a `varies` note and
 *    the page prints it.
 *
 * 2. Nothing here should push someone toward the expensive path. Where a cheaper
 *    route usually works — a legal heir certificate instead of a succession
 *    certificate, a passbook page instead of a cheque — it is named, along with
 *    the reason it sometimes does not.
 *
 * Keyed on SelfObtainedDocument, which is derived from DOCUMENT_SOURCE. Moving a
 * document from 'us' to 'you' will not compile until its steps are written here.
 */

export interface ObtainGuide {
  /** Who actually issues it. Named as precisely as is true nationally. */
  where: string;
  /** Realistic elapsed time, not the best case. */
  howLong: string;
  /** Official cost. Excludes an advocate unless one is unavoidable. */
  cost: string;
  steps: string[];
  /** What differs by state or institution. Always present — it always does. */
  varies: string;
}

export const OBTAINING: Record<SelfObtainedDocument, ObtainGuide> = {
  death_certificate: {
    where:
      'The Registrar of Births and Deaths for the place the death happened — the '
      + 'municipal corporation, municipality or gram panchayat there, not the one '
      + 'where the family lives.',
    howLong: 'A few days to about three weeks',
    cost: 'Free if registered within 21 days; a late fee after that, and after a year it needs a magistrate’s order',
    steps: [
      'Check whether it is already registered before you apply. If the death happened '
      + 'in a hospital, the hospital usually reports it and issues the medical '
      + 'certificate of cause of death — ask them first.',
      'Apply to the registrar for the area where the death occurred. Most states now '
      + 'accept this through their e-District or civil registration portal; the rest '
      + 'need a form at the office.',
      'Carry proof of the death — the hospital certificate, or the cremation or burial '
      + 'receipt — plus the deceased’s Aadhaar or other identity document, and your own '
      + 'identity and address proof.',
      'Ask for several attested copies in the same visit. Every institution keeps the '
      + 'copy you give it, and coming back for more is another trip.',
    ],
    varies:
      'Registration is governed by the Registration of Births and Deaths Act 1969, but '
      + 'the form, the fee and the portal differ in every state.',
  },

  claimant_kyc: {
    where:
      'You already hold most of this. A new PAN comes from Protean (formerly NSDL e-Gov) '
      + 'or UTIITSL; address proof is a current Aadhaar, passport, voter ID or recent '
      + 'utility bill.',
    howLong: 'Immediate if you have them; around two weeks for a fresh PAN',
    cost: 'Roughly ₹107 for a new PAN. Nothing if you already have one.',
    steps: [
      'This is your own KYC as the person making the claim — not the deceased’s.',
      'If you have no PAN, apply online through Protean or UTIITSL using Aadhaar e-KYC. '
      + 'The number is usually issued before the card arrives by post, and the number is '
      + 'what the claim form needs.',
      'Institutions want self-attested photocopies: sign across the copy and date it.',
    ],
    varies:
      'Some institutions insist the address on your proof matches the address written on '
      + 'the claim form. Use the same one throughout and you avoid a rejection.',
  },

  succession_certificate: {
    where:
      'The district civil court with jurisdiction where the deceased ordinarily lived, or '
      + 'where the assets are held.',
    howLong: 'Commonly six to eight months, and longer if anyone objects',
    cost:
      'A court fee calculated as a percentage of the value of the assets claimed — the rate '
      + 'is set by each state and is commonly in the region of 2–3% — plus your advocate’s fee',
    steps: [
      'This one needs an advocate. It is a petition under sections 370 to 390 of the Indian '
      + 'Succession Act, not a form you can file over a counter.',
      'The petition sets out the deceased, the date and place of death, the heirs, and the '
      + 'specific debts and securities being claimed.',
      'The court publishes a notice, usually in a newspaper, inviting anyone with an objection '
      + 'to come forward. That waiting period is most of the elapsed time.',
      'If nobody objects, the court grants the certificate for the debts and securities named '
      + 'in it — and only those, so make sure the list is complete before filing.',
    ],
    varies:
      'A succession certificate covers movable property: bank balances, deposits, shares. It '
      + 'does not transfer land or a house. Before starting, ask the institution whether it '
      + 'will accept a legal heir certificate instead — many will, below their internal limit, '
      + 'and it is far cheaper and faster.',
  },

  legal_heir_certificate: {
    where:
      'The Tahsildar or taluk office for the area where the deceased lived. A few states issue '
      + 'it through the municipal corporation instead.',
    howLong: 'Two to six weeks in most districts',
    cost: 'A nominal fee, usually under ₹100',
    steps: [
      'Apply at the taluk or tahsildar office, or through your state’s online service where '
      + 'there is one — Tamil Nadu uses e-Sevai, Karnataka Nadakacheri, Andhra Pradesh and '
      + 'Telangana MeeSeva.',
      'Take the death certificate, your own identity and address proof, and a list of every '
      + 'surviving family member with their relationship to the deceased and their age.',
      'A revenue official normally verifies the family details, often by visiting or calling, '
      + 'before the certificate is issued.',
      'Ask your bank what it accepts before you rely on this. Many accept a legal heir '
      + 'certificate below a certain balance and insist on a succession certificate above it.',
    ],
    varies:
      'Much cheaper and faster than a succession certificate, but the two are not '
      + 'interchangeable everywhere, and some institutions will not take this one at all.',
  },

  cancelled_cheque: {
    where: 'Your own bank — the account the money should be paid into',
    howLong: 'Immediate',
    cost: 'Nothing',
    steps: [
      'Take a blank cheque leaf from your own account, not the deceased’s.',
      'Draw two parallel lines across it and write CANCELLED between them. Do not sign it.',
      'No chequebook? Most institutions accept the front page of your passbook or a recent '
      + 'bank statement instead, as long as it shows your name, account number and IFSC.',
    ],
    varies:
      'The account has to be in the claimant’s name. Proceeds are never paid into the '
      + 'deceased’s account — it is frozen once the death is reported.',
  },

  will_probate: {
    where:
      'The district court, or the High Court where the estate is large or the property lies in '
      + 'Mumbai, Kolkata or Chennai.',
    howLong: 'Six months to over a year',
    cost:
      'A court fee on the value of the estate, capped in some states, plus your advocate’s fee',
    steps: [
      'This needs an advocate. Probate is the court certifying that the will is genuine and '
      + 'that the executor named in it may act on it.',
      'The executor named in the will applies. Where the will names nobody, or that person '
      + 'cannot act, the court grants letters of administration instead.',
      'The court notifies the legal heirs and allows time for objections before granting.',
      'Ask the institution whether it actually requires probate before you spend on it. Often '
      + 'a registered will is enough on its own.',
    ],
    varies:
      'For Hindus, Buddhists, Sikhs and Jains, probate is compulsory only where the will was '
      + 'made, or the immovable property lies, within the original jurisdiction of the Bombay, '
      + 'Calcutta or Madras High Courts. Elsewhere a will can often be acted on without it.',
  },
};
