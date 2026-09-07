/**
 * FAQ content.
 *
 * Two jobs, which is why it lives in code rather than a CMS:
 *
 *   1. It answers the questions families actually type into Google at 1am.
 *   2. It is the single source for the FAQPage JSON-LD, so the answers Google
 *      shows and the answers on the page can never drift apart.
 *
 * Every question here is phrased the way a real person searches — "do I need a
 * succession certificate", not "Succession Certificate: An Overview". The
 * answers lead with the direct answer, then the nuance. Nobody in this
 * situation wants a preamble.
 */

export interface Faq {
  id: string;
  q: string;
  /** Plain text. Used verbatim in JSON-LD, so no markup. */
  a: string;
  /** Grouping on the page. */
  topic: 'start' | 'documents' | 'money' | 'trust' | 'timing';
}

export const FAQS: readonly Faq[] = [
  // ---- getting started ----------------------------------------------------
  {
    id: 'where-to-start',
    topic: 'start',
    q: 'My father died and I have no idea where to start. What do I do first?',
    a: 'Get the death certificate from the municipal corporation first — nothing else can begin without it, and every institution wants a copy. '
     + 'While you wait, make a list of every account, policy and folio you can find: bank passbooks, insurance documents, mutual fund statements, share certificates, and his PF number. '
     + 'Then run our free check. It takes two minutes, needs no account, and tells you exactly what each institution on your list will ask for.',
  },
  {
    id: 'nominee-vs-heir',
    topic: 'start',
    q: 'There is a nominee on the account. Does the nominee get the money?',
    a: 'No — a nominee receives the money but does not own it. The Supreme Court settled this in Shakti Yezdani v Jayanand Salgaonkar (2023): a nominee holds the funds as a trustee for whoever the law says the legal heirs are. '
     + 'In practice the bank will pay the nominee quickly, which is convenient, but the nominee is then answerable to the other heirs. '
     + 'If there are siblings or a surviving parent, get an affidavit recording everyone\'s shares even when a nomination exists. It protects the nominee more than anyone.',
  },
  {
    id: 'no-will',
    topic: 'start',
    q: 'There is no will. Who inherits?',
    a: 'Whoever the succession law of your community says, and the split is not negotiable. '
     + 'For Hindus, Sikhs, Jains and Buddhists it is the Hindu Succession Act 1956: for a man dying without a will, the widow, each child and his mother each take one share — with all widows sharing a single share between them, not one each. '
     + 'For Christians and Parsis it is the Indian Succession Act 1925. For Muslims it is personal law, which we do not automate. '
     + 'Our free check computes your exact shares and cites the section they come from.',
  },
  {
    id: 'daughters',
    topic: 'start',
    q: 'Do daughters get an equal share?',
    a: 'Yes. Under the Hindu Succession Act, sons and daughters are Class I heirs on identical terms and take equal shares. '
     + 'Since the 2005 amendment, confirmed by the Supreme Court in Vineeta Sharma v Rakesh Sharma (2020), daughters are also coparceners in ancestral property by birth — regardless of whether the father was alive in 2005. '
     + 'Any relative telling you otherwise is describing custom, not law.',
  },

  // ---- documents ----------------------------------------------------------
  {
    id: 'succession-certificate',
    topic: 'documents',
    q: 'Do I need a succession certificate?',
    a: 'Usually only for larger balances where there is no nominee. '
     + 'Most banks settle smaller amounts against an indemnity bond, an affidavit of heirship and no-objection letters from the other heirs — no court involved. Above their internal limit, which varies by bank, they insist on a succession certificate under sections 370 to 390 of the Indian Succession Act. '
     + 'That is a court application and takes six months or more. Our free check tells you which side of the line you are on before you spend anything.',
  },
  {
    id: 'legal-heir-vs-succession',
    topic: 'documents',
    q: 'What is the difference between a legal heir certificate and a succession certificate?',
    a: 'A legal heir certificate is issued by a revenue officer — a tahsildar or equivalent — and simply records who the surviving family members are. It is quick, cheap, and enough for many purposes such as pension transfer and some bank claims. '
     + 'A succession certificate is granted by a civil court and actually authorises you to collect debts and securities owed to the deceased. It carries far more weight, costs court fees calculated on the estate value, and takes months. '
     + 'Ask the institution which one they will accept before you apply for either.',
  },
  {
    id: 'probate',
    topic: 'documents',
    q: 'Do I still need probate for a will?',
    a: 'For most families, no — and this changed recently. '
     + 'The Repealing and Amending Act 2025, which received assent on 20 December 2025, removed section 213 of the Indian Succession Act. That section had made probate compulsory for Hindus, Buddhists, Sikhs, Jains and Parsis for wills made in what were the presidency towns of Mumbai, Kolkata and Chennai. '
     + 'Probate is still available, and still worth having where the will is likely to be contested or a clean chain of title matters. It is simply no longer a blanket requirement.',
  },
  {
    id: 'iepf',
    topic: 'documents',
    q: 'My father had old shares that were transferred to the IEPF. Can I get them back?',
    a: 'Yes, and it is worth doing — small holdings from the 1990s are often worth many lakhs now. '
     + 'You file Form IEPF-5 online, then send a physical pack to the company\'s nodal officer, who verifies it and issues an entitlement letter. The IEPF Authority then transfers the shares to your demat account. '
     + 'The step most families stall on is the entitlement letter, because companies are slow and the pack must be exactly right. We prepare the whole pack including the indemnity bond and affidavit.',
  },
  {
    id: 'stamp-paper',
    topic: 'documents',
    q: 'What is an indemnity bond, and where do I get the stamp paper?',
    a: 'An indemnity bond is your written promise to compensate the bank if someone else later turns out to have a claim on the money. It is what allows a bank to pay you without a court order. '
     + 'It must be printed on non-judicial stamp paper of the value your state prescribes, and signed before a notary. Stamp paper is bought from a licensed vendor or, in most states, online through the e-stamping portal. '
     + 'We draft the wording and tell you the value to buy — but you must buy the paper and visit the notary yourself.',
  },

  // ---- timing -------------------------------------------------------------
  {
    id: 'how-long-bank',
    topic: 'timing',
    q: 'How long does it take to claim money from a bank account?',
    a: 'With a registered nominee, typically two to four weeks once the bank has a complete set of documents. '
     + 'Without a nominee but under the bank\'s threshold, four to eight weeks, because the indemnity bond and no-objection letters take time to gather and notarise. '
     + 'Where a succession certificate is needed, six months to a year, because you are waiting on a court. '
     + 'The single biggest cause of delay is an incomplete first submission — which is exactly what our checklists are for.',
  },
  {
    id: 'multiple-institutions',
    topic: 'timing',
    q: 'Can I claim from several banks and funds at the same time?',
    a: 'Yes, and you should. Each institution runs its own process independently, so filing them in parallel rather than one after another can save months. '
     + 'The exception is anything that needs a court order — get that application moving first, since everything waiting on it will be slower.',
  },

  // ---- money --------------------------------------------------------------
  {
    id: 'cost',
    topic: 'money',
    q: 'What does Mera Hissa cost?',
    a: 'A fixed fee, quoted before you create an account: ₹4,999 for a single institution, ₹14,999 for up to eight holdings, and ₹24,999 for larger estates and IEPF share recovery. '
     + 'We never take a percentage of what you recover. If we look at your case and find we cannot help, you are refunded in full. '
     + 'Court fees, stamp paper, notary charges and any advocate\'s fee are separate and paid by you directly — we never handle those.',
  },
  {
    id: 'why-not-percentage',
    topic: 'money',
    q: 'Other services take a percentage. Why do you charge a flat fee?',
    a: 'Because a percentage creates the wrong incentive and puts us in the same category as recovery agents, which regulators actively warn families about. '
     + 'Preparing the paperwork for a ₹5 lakh claim and a ₹50 lakh claim is nearly identical work. Charging ten times more for the second one would be charging for your loss, not for our effort.',
  },
  {
    id: 'lawyer-needed',
    topic: 'money',
    q: 'Will I need a lawyer as well?',
    a: 'Only if your case needs a court order — a succession certificate, probate, or letters of administration — or if the estate is disputed among heirs. '
     + 'The free check tells you this upfront, before you pay us anything, and we can introduce you to an advocate. Everything around the court application we still prepare, so their time is spent on the filing rather than on paperwork.',
  },

  // ---- trust --------------------------------------------------------------
  {
    id: 'data-safety',
    topic: 'trust',
    q: 'Is it safe to give you a death certificate and account details?',
    a: 'Your scans are read in your own browser and never leave your device during that step. When our software drafts your letters, the AI receives placeholders — never a name, an account number, a PAN or an Aadhaar. '
     + 'Account numbers are asked for in full, because the claim forms we prepare have to carry them, and they are encrypted with a key held outside the database and shown back to you masked. Documents are encrypted, deleted 90 days after your case closes, and you can erase everything yourself at any time. '
     + 'Your information is never used to train any AI system and is never sold.',
  },
  {
    id: 'is-this-legal-advice',
    topic: 'trust',
    q: 'Are you lawyers?',
    a: 'No. Mera Hissa prepares documents and explains the process. We are not a law firm, nothing we give you is legal advice, and we do not represent anyone before a court or tribunal. '
     + 'That is a real limit, not a disclaimer we hide in a footer — where your case needs a lawyer, we say so and step back.',
  },
  {
    id: 'ai-mistake',
    topic: 'trust',
    q: 'You use AI. What if it gets my inheritance share wrong?',
    a: 'It cannot, because AI does not calculate your shares. Those come from code that implements the statute directly, as exact fractions, with the section cited — and every result is checked to total exactly one before it can be used. '
     + 'The AI only writes the covering prose, and a person at Mera Hissa reads every pack before it reaches you. If our templates are out of date for your bank, the case is held rather than sent.',
  },
] as const;

export const TOPIC_LABELS: Record<Faq['topic'], string> = {
  start: 'Where to begin',
  documents: 'Documents and certificates',
  timing: 'How long it takes',
  money: 'Cost',
  trust: 'Trusting us with this',
};

export const TOPIC_ORDER: ReadonlyArray<Faq['topic']> =
  ['start', 'documents', 'timing', 'money', 'trust'] as const;

export function faqsByTopic(topic: Faq['topic']): Faq[] {
  return FAQS.filter((f) => f.topic === topic);
}
