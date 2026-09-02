/**
 * Guide content.
 *
 * One page per real search query, at a URL that reads like the question.
 * These exist to be genuinely the best free answer on the internet for that
 * query — which is both the honest thing to publish and, per Google's own
 * guidance, what actually ranks.
 *
 * Each guide answers the question completely. There is no "sign up to see the
 * rest". Someone who reads a guide and solves their own problem without paying
 * us is a success: they will tell someone else.
 */

export interface GuideSection { heading: string; body: string[] }

export interface Guide {
  slug: string;
  /** The <title>. Under 60 characters so Google does not truncate it. */
  title: string;
  /** Meta description. 150-160 characters. */
  description: string;
  /** The H1 — phrased as the question a person would ask. */
  h1: string;
  /** One-paragraph answer, before any detail. */
  answer: string;
  sections: GuideSection[];
  updated: string;
  related: string[];
}

export const GUIDES: readonly Guide[] = [
  {
    slug: 'claim-bank-account-after-death',
    title: 'How to claim a bank account after death in India',
    description:
      'The exact documents Indian banks ask for to release a deceased person\'s account — with and without a nominee — and how long each route takes.',
    h1: 'How do I claim my father\'s bank account after his death?',
    updated: '2026-08-22',
    answer:
      'Which documents the bank asks for depends almost entirely on two things: whether a nominee was registered, '
      + 'and how much is in the account. With a nominee it is a short form and a death certificate. Without one, it is an indemnity bond, '
      + 'an affidavit and no-objection letters from the other heirs — or, above the bank\'s internal limit, a succession certificate from a court.',
    sections: [
      {
        heading: 'If a nominee was registered',
        body: [
          'This is the quick route. The bank needs the death certificate, the nominee\'s KYC documents, and its own nominee claim form. Most banks settle within two to four weeks.',
          'One thing families get wrong: receiving the money as nominee does not make it yours. The Supreme Court held in Shakti Yezdani v Jayanand Salgaonkar (2023) that a nominee holds the funds in trust for the legal heirs. If you have siblings or a surviving parent, record everyone\'s shares in an affidavit at the same time. It protects you, not them.',
        ],
      },
      {
        heading: 'If there is no nominee and the balance is modest',
        body: [
          'Banks settle smaller balances without going near a court. You will typically need the death certificate, the bank\'s claim form for a deceased depositor, an affidavit of heirship, no-objection letters from every other legal heir, and an indemnity bond on stamp paper.',
          'Some banks also want two sureties — people of means who countersign the indemnity. The threshold at which this kicks in differs by bank and is not published consistently, so ask the branch directly.',
        ],
      },
      {
        heading: 'If there is no nominee and the balance is large',
        body: [
          'Above its internal limit the bank will insist on a succession certificate under sections 370 to 390 of the Indian Succession Act. This is a civil court application, needs an advocate, and realistically takes six months to a year.',
          'Some banks accept a legal heir certificate from the tahsildar instead, which is far quicker. Always ask whether they will, before you start a court application you may not need.',
        ],
      },
      {
        heading: 'What slows people down',
        body: [
          'Almost every delay traces back to an incomplete first submission. The branch accepts the file, it travels to a regional processing centre, and three weeks later it comes back with one document missing.',
          'Submit to every institution in parallel rather than one after another. Each runs its own process and there is nothing to gain by waiting.',
        ],
      },
    ],
    related: ['succession-certificate-india', 'nominee-vs-legal-heir'],
  },
  {
    slug: 'succession-certificate-india',
    title: 'Succession certificate in India: when you need one',
    description:
      'When a succession certificate is genuinely required, how it differs from a legal heir certificate, what it costs and how long the court takes.',
    h1: 'Do I need a succession certificate, and how do I get one?',
    updated: '2026-08-22',
    answer:
      'You need one when an institution holding a large sum refuses to release it on an indemnity bond alone — usually a bank, a company registrar or a mutual fund. '
      + 'It is granted by a civil court under sections 370 to 390 of the Indian Succession Act, requires an advocate, and takes six months or more. '
      + 'Many families apply for one they did not need, because nobody told them a legal heir certificate would have been accepted.',
    sections: [
      {
        heading: 'Check whether you actually need one',
        body: [
          'Before starting a court application, ask each institution in writing what they will accept. Many will settle against an indemnity bond and affidavit, or accept a legal heir certificate from the revenue authority — both dramatically faster.',
          'A succession certificate covers debts and securities: bank balances, shares, debentures, deposits. It does not deal with immovable property, which needs different documents entirely.',
        ],
      },
      {
        heading: 'What the process involves',
        body: [
          'A petition is filed in the district court where the deceased lived or where the assets are. It lists the heirs, the assets, and the shares claimed. The court issues a public notice, usually in a newspaper, inviting objections, and waits — commonly 45 days.',
          'If nobody objects, the court grants the certificate on payment of court fees, which are calculated as a percentage of the value of the assets and vary by state. If someone does object, it becomes a contested suit and the timeline extends considerably.',
        ],
      },
      {
        heading: 'Legal heir certificate versus succession certificate',
        body: [
          'A legal heir certificate is issued by a tahsildar or equivalent revenue officer and simply records who the surviving family members are. It is quick — often two to four weeks — and cheap, and is enough for pension transfer, provident fund claims and many bank settlements.',
          'A succession certificate is a court order authorising you to collect debts and securities. It carries far more weight and is what a bank falls back on when the sum is large or the family situation is unclear.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'legal-heir-certificate'],
  },
  {
    slug: 'nominee-vs-legal-heir',
    title: 'Nominee vs legal heir: who actually inherits?',
    description:
      'A nominee receives the money but does not own it. What the Supreme Court held in Shakti Yezdani, and what that means for your family.',
    h1: 'The account has a nominee. Does the nominee keep the money?',
    updated: '2026-08-22',
    answer:
      'No. A nominee is a receiver, not an owner. The Supreme Court confirmed this in Shakti Yezdani v Jayanand Salgaonkar (December 2023): '
      + 'nomination decides who the institution pays, and succession law decides who the money belongs to. '
      + 'A nominee who keeps a share belonging to another heir can be made to account for it.',
    sections: [
      {
        heading: 'Why the distinction exists',
        body: [
          'Nomination was created to give banks and companies a safe person to pay, so that funds are not frozen for years while a family sorts itself out. It was never meant to override succession law, and the courts have consistently said so.',
          'The practical effect is that the eldest son named as nominee on every account does not thereby inherit everything. His sisters and mother remain entitled to their statutory shares.',
        ],
      },
      {
        heading: 'What a nominee should do',
        body: [
          'Collect the money using the nomination — that part is genuinely quicker. Then distribute according to the legal shares, and record the distribution in a family settlement or an affidavit signed by all heirs.',
          'This protects the nominee. Without it, a sibling can raise a claim years later, and the nominee is the one holding the money.',
        ],
      },
      {
        heading: 'Where nomination does confer ownership',
        body: [
          'There are narrow exceptions where a specific statute says otherwise, and insurance is the one families encounter most: under section 39 of the Insurance Act, a "beneficial nominee" — a parent, spouse or child named by the policyholder — takes the proceeds beneficially rather than as a trustee.',
          'If you are unsure which applies to a particular policy, that is a question for an advocate rather than for a website.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'hindu-succession-shares'],
  },
  {
    slug: 'hindu-succession-shares',
    title: 'Who inherits under the Hindu Succession Act?',
    description:
      'How intestate shares work under the Hindu Succession Act 1956 — Class I heirs, the rule for multiple widows, and daughters\' equal rights after 2005.',
    h1: 'Who inherits when a Hindu dies without a will?',
    updated: '2026-08-22',
    answer:
      'Class I heirs inherit, all at once and to the exclusion of everyone else: the widow, every son and daughter, and the mother. '
      + 'Each takes one share — except that all widows together share a single share between them, rather than one each. '
      + 'Sons and daughters take exactly the same amount.',
    sections: [
      {
        heading: 'The Class I list',
        body: [
          'For a Hindu man dying without a will, section 8 of the Hindu Succession Act 1956 gives everything to Class I heirs: his widow, his sons, his daughters, and his mother, along with the children of any child who predeceased him.',
          'His father is not a Class I heir. Neither are his brothers or sisters. They only inherit if no Class I heir survives — which surprises many families.',
        ],
      },
      {
        heading: 'The multiple-widow rule, which is easy to get wrong',
        body: [
          'Section 10 distributes per capita, with one exception. All widows collectively take one share, divided among themselves. So two widows and one son is one quarter, one quarter, one half — not one third each.',
          'This is the single most common arithmetic error we see in family settlements, and getting it wrong invites a challenge years later.',
        ],
      },
      {
        heading: 'Daughters',
        body: [
          'Daughters are Class I heirs on identical terms to sons and always have been under this Act. Since the 2005 amendment they are also coparceners in ancestral property by birth.',
          'The Supreme Court held in Vineeta Sharma v Rakesh Sharma (2020) that this applies regardless of whether the father was alive on the date of the amendment, settling years of conflicting judgments.',
        ],
      },
      {
        heading: 'When a Hindu woman dies without a will',
        body: [
          'Section 15 sets out a different order. Her sons, daughters and husband take equally first.',
          'There is an important wrinkle: if the property was inherited from her parents, and she leaves no children, it reverts to her father\'s heirs. If inherited from her husband or father-in-law, it reverts to his. This depends on where each asset came from, so it is a question of fact rather than a formula.',
        ],
      },
    ],
    related: ['nominee-vs-legal-heir', 'succession-certificate-india'],
  },
  {
    slug: 'iepf-share-claim',
    title: 'How to claim shares transferred to the IEPF',
    description:
      'Shares moved to the IEPF because dividends went unclaimed can be recovered with Form IEPF-5. The full process, and the step most families stall on.',
    h1: 'My father\'s old shares went to the IEPF. How do I get them back?',
    updated: '2026-08-22',
    answer:
      'File Form IEPF-5 online, then send a physical pack to the company\'s nodal officer, who verifies it and issues an entitlement letter. '
      + 'The IEPF Authority then transfers the shares into your demat account. It is worth doing: a small holding bought in the 1990s is often worth many lakhs today.',
    sections: [
      {
        heading: 'Why the shares moved',
        body: [
          'Under the Companies Act, if dividends on a holding go unclaimed for seven consecutive years, the company must transfer both the unpaid dividends and the underlying shares to the Investor Education and Protection Fund.',
          'This happens quietly. Families usually discover it only when they go looking for a share certificate they knew existed.',
        ],
      },
      {
        heading: 'The process, in order',
        body: [
          'First, confirm the holding on the IEPF Authority website using the company name and folio number. Second, file Form IEPF-5 online and print the acknowledgement.',
          'Third, send the physical pack to the company\'s nodal officer: the acknowledgement, an indemnity bond on stamp paper, an advance receipt, the original share certificate if you have it, the death certificate, proof of your entitlement as heir, and a cancelled cheque of the Aadhaar-linked account.',
          'Fourth — and this is the slow part — the company verifies and issues an entitlement letter to the IEPF Authority. Fifth, the Authority credits the shares to your demat account.',
        ],
      },
      {
        heading: 'Where families get stuck',
        body: [
          'The entitlement letter. Companies process these in batches, some are slow, and a pack with any defect goes to the back of the queue rather than getting a phone call.',
          'The second common problem is a name mismatch: the shares are in "R. K. Gupta" and the death certificate says "Ramesh Kumar Gupta". Expect to need an affidavit explaining that these are the same person.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'succession-certificate-india'],
  },
  {
    slug: 'legal-heir-certificate',
    title: 'Legal heir certificate: how to apply in India',
    description:
      'What a legal heir certificate is, which claims it is enough for, and how to apply through the tahsildar or your state\'s e-district portal.',
    h1: 'How do I get a legal heir certificate?',
    updated: '2026-08-22',
    answer:
      'You apply to the tahsildar or equivalent revenue officer for the area where the deceased lived, in person or through your state\'s e-district portal. '
      + 'It records who the surviving family members are, usually takes two to four weeks, and costs very little. '
      + 'For many claims it is accepted in place of a succession certificate — always ask before starting a court application.',
    sections: [
      {
        heading: 'What it is for',
        body: [
          'A legal heir certificate identifies the surviving family members of a deceased person. It is routinely accepted for pension transfer, provident fund and gratuity claims, insurance settlements, and many bank claims below the bank\'s threshold.',
          'It is not a determination of ownership. Where the estate is disputed, or the sum is large, an institution can still insist on a succession certificate.',
        ],
      },
      {
        heading: 'What to take with you',
        body: [
          'A completed application, the death certificate, proof of your own identity and address, proof of relationship such as a ration card or school certificate, and an affidavit listing all surviving heirs.',
          'Requirements vary by state, and several states now accept the whole application online through an e-district portal. Check yours before travelling to an office.',
        ],
      },
      {
        heading: 'What happens next',
        body: [
          'A revenue inspector or village officer verifies the family details locally, sometimes by visiting. The certificate is then issued naming each heir and their relationship.',
          'If an heir has been left off, object immediately. Correcting it later is considerably harder than getting it right at the verification stage.',
        ],
      },
    ],
    related: ['succession-certificate-india', 'claim-bank-account-after-death'],
  },
  {
    slug: 'claim-inheritance-when-sister-dies',
    title: 'Claiming a sister\'s inheritance after her death in India',
    description:
      'Who inherits when a woman dies without a will in India, why a brother or sister is often not first in line, and the one rule that decides most sibling claims.',
    h1: 'My sister passed away. How do I claim her inheritance?',
    updated: '2026-08-31',
    answer:
      'It depends on whether she was married and had children, because for a woman who dies without a will the law sets a fixed order. '
      + 'Her children and husband come first; if there are none, her parents; only if there are no parents either do her brothers and sisters inherit. '
      + 'There is one important exception: property she had inherited from her own parents goes back to their side of the family if she leaves no children — '
      + 'and that is the route by which a sibling most often does have a claim.',
    sections: [
      {
        heading: 'The order the law sets for a woman who dies without a will',
        body: [
          'Section 15(1) of the Hindu Succession Act 1956 lists who inherits from a Hindu woman, in a strict order. First, her sons and daughters and her husband, who take equally. If there are none of those, her husband\'s heirs. If none of those, her mother and father. Only if there are no parents either does the estate pass to her father\'s heirs — which is where her brothers and sisters come in — and after that to her mother\'s heirs.',
          'So if your sister left children or a husband, they inherit and you do not. If she was unmarried and either of your parents is alive, your parents inherit, and you would act on their behalf rather than in your own name. Getting this wrong is the commonest reason a sibling\'s claim is rejected outright.',
        ],
      },
      {
        heading: 'The rule that decides most sibling claims',
        body: [
          'Section 15(2) reverses the order for property a woman inherited rather than earned. Anything she inherited from her mother or father goes back to her father\'s heirs if she leaves no son or daughter — regardless of a surviving husband. Anything she inherited from her husband or father-in-law goes back to her husband\'s heirs.',
          'In practice this is how a brother or sister most often ends up entitled: a share of the family home, or money that came to her from your parents, returns to your side of the family if she had no children. But it depends on where each asset came from, which is a question of fact rather than a formula. Expect to have to show it, and expect it to need an advocate if anyone disputes it.',
        ],
      },
      {
        heading: 'If she was married',
        body: [
          'Her husband and any children take everything under section 15(1)(a), in equal shares, with the section 15(2) exception above for property she had inherited from your parents. If her husband has also died, the estate passes to his heirs before it comes to yours — a result many families find surprising, and one worth knowing before a difficult conversation.',
        ],
      },
      {
        heading: 'What you will actually need to file',
        body: [
          'Whoever the rightful heirs turn out to be, the institutions holding her money will want the death certificate, the claimant\'s PAN and address proof, and something establishing who the heirs are — usually a legal heir certificate from the tahsildar, backed by an affidavit listing every surviving relative and no-objection letters from the heirs who are not claiming.',
          'For a bank account or fixed deposit above the bank\'s internal limit with no nominee, the bank will insist on a succession certificate from a civil court instead, which needs an advocate and takes six months or more. Ask each institution in writing what it will accept before you start a court application you may not need.',
        ],
      },
      {
        heading: 'If there is a will, or she was not Hindu',
        body: [
          'A valid will overrides all of the above; the estate goes as the will says, and the documents are different. If your sister was Christian, the Indian Succession Act 1925 applies instead and the order of heirs is different again. If she was Muslim, the shares follow the school-specific rules of Muslim personal law, which we do not automate — those cases go to an advocate.',
          'The free check applies the right law to your family in about two minutes, tells you who the claimants actually are, and says plainly if any part of it needs a lawyer.',
        ],
      },
    ],
    related: ['hindu-succession-shares', 'legal-heir-certificate', 'succession-certificate-india'],
  },
] as const;

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
