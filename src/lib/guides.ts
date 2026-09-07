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
  // -------------------------------------------------------------------------
  // The following guides are each phrased as the question a person actually
  // types into a search box, and target that long-tail query directly.
  // -------------------------------------------------------------------------
  {
    slug: 'how-to-get-death-certificate-india',
    title: 'How to get a death certificate in India',
    description:
      'Where to register a death, the 21-day deadline and what happens after it, how many certified copies you need, and why every claim starts with this document.',
    h1: 'How do I get a death certificate?',
    updated: '2026-08-31',
    answer:
      'A death is registered with the local municipal corporation, municipality or gram panchayat, ideally within 21 days. The hospital usually issues the medical cause-of-death form; the registrar then issues certified copies. '
      + 'Get at least eight to ten copies — every bank, fund, insurer and office will want an original or attested copy, and nothing else moves until you have them.',
    sections: [
      {
        heading: 'Where and how to register',
        body: [
          'Under the Registration of Births and Deaths Act 1969, a death in a hospital is reported by the hospital; a death at home is reported by the head of the household to the local registrar — the municipal corporation in cities, the panchayat in villages. Most states now let you apply and download certified copies online through the municipal or e-district portal.',
          'You will need the medical certificate of cause of death, the deceased\'s identity proof, and the informant\'s identity proof. Check the spelling of the name against the deceased\'s PAN and bank records before the certificate is printed: a mismatch here follows you into every subsequent claim.',
        ],
      },
      {
        heading: 'The deadline, and what to do if you missed it',
        body: [
          'Registration within 21 days is free. Between 21 and 30 days a late fee applies. After 30 days you need an affidavit and the registrar\'s permission; after a year, an order from a magistrate. None of this is impossible — it is just slower each step, so register early even in the fog of the first weeks.',
        ],
      },
      {
        heading: 'How many copies, and why',
        body: [
          'Every institution keeps a copy. A family with two bank accounts, an insurance policy, a provident fund and some shares can easily need eight originals or attested copies. Copies are cheap at the time of registration and tedious to obtain later, so over-order.',
          'Once you have the certificate, the next step is working out what each institution will ask for — which depends on nomination and the amount involved. Our guide on claiming a bank account after a death walks through that.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'legal-heir-certificate', 'documents-needed-to-claim-deceased-money'],
  },
  {
    slug: 'documents-needed-to-claim-deceased-money',
    title: 'Documents needed to claim a deceased person\'s money',
    description:
      'The complete document list for claiming a family member\'s bank accounts, deposits, insurance, provident fund and investments in India — and which ones depend on nomination and amount.',
    h1: 'What documents do I need to claim my father\'s money after his death?',
    updated: '2026-08-31',
    answer:
      'Three documents are needed by every institution: the death certificate, your own PAN and address proof, and the institution\'s own claim form. Beyond those, what is asked for depends on two things — whether a nominee was registered, and how much is involved. '
      + 'With a nominee, that is nearly all. Without one, add an affidavit of heirship, no-objection letters from the other heirs and an indemnity bond; above the institution\'s limit, a succession certificate from a court.',
    sections: [
      {
        heading: 'The documents every claim needs',
        body: [
          'The death certificate, original or attested. The claimant\'s PAN and an address proof such as Aadhaar or passport. The institution\'s own claim form, which differs bank to bank and fund to fund. A cancelled cheque for the account the money should go to. And the original passbook, deposit receipt, policy document or share certificate where one exists.',
        ],
      },
      {
        heading: 'Where there is a nominee',
        body: [
          'The nominee\'s KYC and the nominee claim form are usually enough. The Reserve Bank expects banks to settle a nominee\'s claim within fifteen days of receiving complete documents. Remember that receiving the money as nominee does not make it yours: the Supreme Court held in Shakti Yezdani v Jayanand Salgaonkar (2023) that a nominee holds for the legal heirs.',
        ],
      },
      {
        heading: 'Where there is no nominee',
        body: [
          'Add an affidavit of heirship listing every surviving legal heir, a no-objection letter from each heir who is not claiming, and an indemnity bond on stamp paper. Many banks also ask for a legal heir certificate from the tahsildar, and some for two sureties above a limit.',
          'Above the institution\'s internal threshold, none of that suffices and a succession certificate from a civil court is insisted on — a process that needs an advocate and takes six months or more. Ask each institution in writing what it will accept before starting one.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'affidavit-of-heirship-how-to-write', 'noc-from-legal-heirs'],
  },
  {
    slug: 'affidavit-of-heirship-how-to-write',
    title: 'Affidavit of heirship: what it is and what it contains',
    description:
      'What an affidavit of legal heirship is, exactly what it must state, who swears it, and the stamp-paper and notary formalities banks and funds expect in India.',
    h1: 'How do I write an affidavit of legal heirship?',
    updated: '2026-08-31',
    answer:
      'An affidavit of heirship is a sworn statement, made by one of the legal heirs before a notary or magistrate, recording who died, when, and who all the surviving legal heirs are and how each is related. '
      + 'It is executed on non-judicial stamp paper of the value your state prescribes, and it is the document that lets an institution settle a claim without a court certificate. Leave one heir off it and the claim will come back.',
    sections: [
      {
        heading: 'What it must state',
        body: [
          'The full name of the deceased as it appears on the death certificate, the date and place of death, and a statement that they died without leaving a will (or identifying the will, if there is one). Then a complete list of every surviving legal heir — spouse, children, and for a Hindu man his mother — with each person\'s full name, age, relationship and address. Finally, a declaration that no one has been left out and that the deponent is aware of the consequences of a false statement.',
          'The list is the point. Institutions rely on it to be sure no one will appear later with a competing claim, which is why an omitted heir — a married daughter, a child from an earlier marriage — is the commonest reason for rejection.',
        ],
      },
      {
        heading: 'Formalities',
        body: [
          'Non-judicial stamp paper, with the value set by your state\'s stamp law — typically between ten and one hundred rupees, but check. Sworn before a notary public or an executive magistrate, who signs and seals it. Some institutions want it on their own format, so ask for that before you draft.',
        ],
      },
      {
        heading: 'How it fits with the other documents',
        body: [
          'It sits alongside no-objection letters from the heirs who are not claiming and an indemnity bond from the one who is. Together those three are what a bank or fund accepts instead of a succession certificate for balances below its limit. We prepare all three, populated from the family details you give us, as part of every pack.',
        ],
      },
    ],
    related: ['documents-needed-to-claim-deceased-money', 'noc-from-legal-heirs', 'indemnity-bond-bank-claim'],
  },
  {
    slug: 'indemnity-bond-bank-claim',
    title: 'Indemnity bond for a deceased account claim, explained',
    description:
      'Why banks ask for an indemnity bond when there is no nominee, what you are actually promising when you sign one, sureties, and the stamp-paper formalities.',
    h1: 'What is an indemnity bond, and why does the bank want one?',
    updated: '2026-08-31',
    answer:
      'An indemnity bond is your written promise to repay the bank if someone with a better claim to the money turns up after it has been paid to you. Banks ask for it when there is no nominee, because they are paying out on your word rather than on a court order. '
      + 'It is executed on stamp paper, and above a certain amount the bank may want one or two sureties — people of means who countersign the promise.',
    sections: [
      {
        heading: 'What you are promising',
        body: [
          'That you are entitled to what you are claiming, that you have disclosed every legal heir, and that if a rightful claimant later appears, you — not the bank — will make good the amount. It is not a formality: it is the mechanism that lets a bank release money without a succession certificate, and it shifts the risk of a wrong payment onto you.',
        ],
      },
      {
        heading: 'Sureties, and when they are asked for',
        body: [
          'Below a bank\'s no-surety limit, your own bond is enough. Above it, most public sector banks want one or two sureties who are acceptable to the bank — typically account holders with a balance or income comparable to the amount claimed. The limit differs by bank and is not published consistently, so ask the branch directly.',
        ],
      },
      {
        heading: 'Formalities and the usual mistakes',
        body: [
          'Non-judicial stamp paper of the value your state prescribes for indemnity bonds, which is higher than for an affidavit. Signed by the claimant and any sureties, usually witnessed, and often notarised. Use the bank\'s own format if it has one.',
          'The common mistakes are using the wrong stamp value, leaving the surety\'s details incomplete, and signing a bond for one account when the bank wanted one per account. Each sends the file back to the queue.',
        ],
      },
    ],
    related: ['affidavit-of-heirship-how-to-write', 'noc-from-legal-heirs', 'claim-bank-account-after-death'],
  },
  {
    slug: 'noc-from-legal-heirs',
    title: 'NOC from legal heirs: what it is and how to get one',
    description:
      'What a no-objection certificate from the other legal heirs is, who must sign it, what it must say, and what to do if an heir refuses or cannot be found.',
    h1: 'What is a no-objection certificate from the other legal heirs?',
    updated: '2026-08-31',
    answer:
      'A no-objection certificate, or NOC, is a signed statement from each legal heir who is not claiming, saying they have no objection to the money being paid to the heir who is. Institutions ask for it when there is no nominee, because it protects them from a later dispute. '
      + 'Every non-claiming heir signs one, it is usually notarised, and it goes in with the affidavit of heirship and indemnity bond.',
    sections: [
      {
        heading: 'Who signs, and what it says',
        body: [
          'Every legal heir other than the claimant — in a Hindu family typically the widow, each child, and the deceased\'s mother, minus whichever one is claiming. Each states who they are, how they were related to the deceased, that they are aware of the claim, and that they have no objection to the money being released to the named claimant. A copy of the signer\'s identity proof is attached.',
          'Signing an NOC does not necessarily give up the signer\'s share. It lets the claimant collect the money. What happens to it afterwards is a matter between the heirs, which is why families are wise to record the intended division in a settlement or the affidavit at the same time.',
        ],
      },
      {
        heading: 'If an heir refuses, or cannot be found',
        body: [
          'Then the no-nominee shortcut is closed for that institution. Without every NOC, the bank or fund will insist on a succession certificate, because the court process is precisely what exists to resolve who is entitled. That means an advocate and several months.',
          'An heir abroad can sign before the Indian consulate or a notary there and courier the original. A minor heir\'s NOC is signed by their guardian, and many institutions will still ask for a court\'s guardianship order for anything substantial.',
        ],
      },
    ],
    related: ['affidavit-of-heirship-how-to-write', 'indemnity-bond-bank-claim', 'succession-certificate-india'],
  },
  {
    slug: 'how-long-to-claim-deceased-bank-account',
    title: 'How long it takes to claim a deceased person\'s money',
    description:
      'Realistic timelines for releasing a deceased family member\'s bank account, deposits, insurance and investments in India — with a nominee, without one, and when a court is involved.',
    h1: 'How long does it take to get a deceased person\'s money released?',
    updated: '2026-08-31',
    answer:
      'With a registered nominee and a complete file: two to four weeks, and the Reserve Bank expects banks to settle within fifteen days of receiving everything. Without a nominee but below the institution\'s limit: four to twelve weeks. '
      + 'Where a succession certificate is needed: six months to a year, most of it waiting on the court. Almost every delay beyond these traces back to an incomplete first submission.',
    sections: [
      {
        heading: 'The three timelines',
        body: [
          'Nominee: the quick route. Death certificate, nominee KYC, the claim form. Banks are directed to settle within fifteen days of complete documents; insurers within thirty. Two to four weeks is realistic once the file is in.',
          'No nominee, modest balance: affidavit, NOCs, indemnity bond. The branch forwards it to a regional centre, which checks it and comes back with queries. Four to twelve weeks, and longer if anything is missing.',
          'Succession certificate: a civil court petition, a public notice with a waiting period of typically forty-five days, then the order. Six months is a good outcome; a year is common; a contested petition takes longer.',
        ],
      },
      {
        heading: 'What actually causes delays',
        body: [
          'An incomplete first submission is the overwhelming cause. The branch accepts the file, it travels to processing, and weeks later it returns with one document missing — a name mismatch, an NOC from an heir nobody mentioned, the wrong stamp value. Each round trip costs three weeks.',
          'The second cause is doing institutions one at a time. Each runs its own process, so submit to all of them in parallel: the bank, the fund house, the insurer and the provident fund office can all be working at once.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'bank-refusing-to-release-money', 'documents-needed-to-claim-deceased-money'],
  },
  {
    slug: 'bank-refusing-to-release-money',
    title: 'Bank refusing to release a deceased\'s money: what to do',
    description:
      'How to escalate when a bank stalls or refuses a deceased account claim — the grievance route, the Reserve Bank\'s directions, and when to go to the banking ombudsman.',
    h1: 'The bank is refusing to release my father\'s money. What can I do?',
    updated: '2026-08-31',
    answer:
      'First, get the refusal in writing with the reason, because a branch "not able to help" and a formal rejection are different things. Then escalate inside the bank — its grievance cell and nodal officer — citing the Reserve Bank\'s direction that deceased claims be settled promptly against a complete file. '
      + 'If thirty days pass without resolution, complain to the RBI\'s Integrated Ombudsman online. Banks respond to that step quickly.',
    sections: [
      {
        heading: 'Work out what kind of refusal it is',
        body: [
          'Often the branch is not refusing the claim; it is refusing to process an incomplete one, and has not said so clearly. Ask, in writing, exactly which document is missing or which rule is being applied. If the answer is a specific document, supply it. If the answer is that the balance is above their limit and needs a succession certificate, that is a legitimate position, not obstruction.',
          'A genuine refusal — declining a nominee\'s claim, demanding a succession certificate for a small balance, or simply not responding — is what the escalation route is for.',
        ],
      },
      {
        heading: 'Escalate, in this order',
        body: [
          'One: a written complaint to the branch manager, keeping a copy. Two: the bank\'s customer grievance cell and its principal nodal officer, whose details every bank must publish. Cite the Reserve Bank\'s directions on settlement of deceased depositors\' claims, which require banks to settle nominee claims within fifteen days of complete documents and to have simplified procedures for claims without nomination.',
          'Three: if the bank does not resolve it within thirty days of your complaint, file with the RBI Integrated Ombudsman at cms.rbi.org.in. It is free, online, and banks treat an ombudsman complaint with a seriousness that a branch visit never gets.',
        ],
      },
      {
        heading: 'What we do',
        body: [
          'We prepare the file so it is complete the first time, which removes most refusals before they happen, and the pack includes the escalation letter, ready to send, in case they do.',
        ],
      },
    ],
    related: ['how-long-to-claim-deceased-bank-account', 'claim-bank-account-after-death', 'succession-certificate-india'],
  },
  {
    slug: 'using-deceased-atm-card-net-banking',
    title: 'Can I use my late father\'s ATM card or net banking?',
    description:
      'Why operating a deceased person\'s bank account with their card or login is not lawful, what problems it causes for the heirs, and what to do instead.',
    h1: 'Can I use my late father\'s ATM card or net banking to take out his money?',
    updated: '2026-08-31',
    answer:
      'No, and it is worth understanding why rather than just being told. A person\'s authority to operate their account ends at death, and so does anyone\'s authority to act for them. Money drawn afterwards with their card or password is taken without authority, however good the intention — '
      + 'and it can be treated as misappropriation if another heir objects. The money belongs to all the legal heirs from the moment of death, not to whoever holds the card.',
    sections: [
      {
        heading: 'What actually happens at death',
        body: [
          'The account holder\'s mandate to the bank ends. The bank, once informed, freezes the account and pays out only through the deceased-claim process — to the nominee, or to the legal heirs on proof of entitlement. Withdrawals made between the death and the bank learning of it are not invisible: the date on the death certificate is compared with the statement, and the bank can recover them from the claim.',
        ],
      },
      {
        heading: 'Why it hurts the family',
        body: [
          'The money is shared property of the heirs. A withdrawal by one of them, even for the funeral, is a withdrawal from the others\' shares, and it is the single most common trigger for a dispute that then blocks the whole claim. Sisters, a stepmother, a child from an earlier marriage — anyone with a share can object, and a bank faced with an objection will insist on a court certificate.',
          'It also creates a false picture. If the account shows recent withdrawals, the bank\'s processing centre will ask who made them and why, and the claim stalls until that is explained.',
        ],
      },
      {
        heading: 'What to do instead',
        body: [
          'Inform the bank of the death promptly and start the claim. If money is needed urgently for the funeral, most banks will release a reasonable amount to the family against the death certificate and a simple request, precisely because they know this need exists. Ask for that rather than taking it.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'documents-needed-to-claim-deceased-money', 'husband-died-without-will-what-am-i-entitled-to'],
  },
  {
    slug: 'do-i-need-a-lawyer-to-claim-bank-account',
    title: 'Do I need a lawyer to claim a deceased bank account?',
    description:
      'When a lawyer is genuinely needed to claim a deceased family member\'s money in India, when they are not, and how to tell which situation you are in before paying for either.',
    h1: 'Do I need a lawyer to claim my father\'s bank account?',
    updated: '2026-08-31',
    answer:
      'Usually not. A nominee\'s claim, and a no-nominee claim below the bank\'s limit, are paperwork — forms, an affidavit, NOCs and an indemnity bond — that a family can complete without an advocate. '
      + 'You do need one for a succession certificate, probate of a will, any dispute between heirs, and Muslim intestate shares. The free check tells you which side of that line your case is on before you spend anything.',
    sections: [
      {
        heading: 'When you do not',
        body: [
          'If a nominee was registered, the bank pays the nominee on the death certificate and KYC. No lawyer. If there was no nominee but the balance is under the bank\'s internal limit, the bank settles on an affidavit of heirship, NOCs from the other heirs and an indemnity bond. These are prepared documents, not legal proceedings, and preparing them well is exactly what we do.',
        ],
      },
      {
        heading: 'When you do',
        body: [
          'A succession certificate is a court application under the Indian Succession Act, and it needs an advocate to draft and appear. Probate or letters of administration for a will, likewise. If two heirs disagree about who is entitled, or an heir refuses an NOC, the matter is going to court whether anyone wants it to or not. And Muslim intestate succession involves school-specific rules that should be computed by a qualified person, not software.',
          'We say so before payment when your case is one of these, and we can introduce you to an advocate who handles them. We prepare everything around the court step; the step itself is theirs.',
        ],
      },
    ],
    related: ['succession-certificate-india', 'claim-bank-account-after-death', 'noc-from-legal-heirs'],
  },
  {
    slug: 'claim-lic-policy-after-death',
    title: 'How to claim an LIC policy after the policyholder\'s death',
    description:
      'The LIC death-claim process step by step: which forms, what documents, how the nominee is paid, what changes if the death was within three years, and the 30-day settlement rule.',
    h1: 'How do I claim an LIC policy after the policyholder\'s death?',
    updated: '2026-08-31',
    answer:
      'Inform the LIC branch that services the policy, in writing, quoting the policy number. Submit the claimant\'s statement form, the original policy document, the death certificate, and the nominee\'s identity, address and bank proof. '
      + 'The insurer must settle a clean claim within thirty days of complete documents. If the death was within three years of the policy starting, expect additional forms and closer scrutiny, but not refusal by default.',
    sections: [
      {
        heading: 'Forms and documents',
        body: [
          'The claimant\'s statement (LIC Form 3783), giving the deceased\'s details and the cause of death. The original policy bond — or an indemnity if it is lost. The death certificate. The nominee\'s PAN, address proof and a cancelled cheque. Where the death was in hospital, a certificate from the attending doctor (Form 3784) and a hospital treatment form (Form 3785); where there was a burial or cremation before a certificate, the certificate of burial or cremation (Form 3801).',
          'Where the death was an accident or unnatural, add the FIR, post-mortem report and police final report — these are what the insurer checks for accident benefits and for exclusions.',
        ],
      },
      {
        heading: 'Who gets paid',
        body: [
          'The nominee, if one was registered. Since the 2015 amendment to section 39 of the Insurance Act, a nominee who is the policyholder\'s spouse, parent or child is a "beneficial nominee" and takes the proceeds as their own — one of the narrow situations where nomination does confer ownership. Any other nominee holds for the legal heirs.',
          'With no nominee, the insurer pays the legal heirs on proof of entitlement: an affidavit, NOCs, and for larger sums a succession certificate. This is where an unnominated policy becomes a longer claim.',
        ],
      },
      {
        heading: 'Early claims and the three-year rule',
        body: [
          'If the policy was less than three years old at the death, the insurer investigates before paying — checking the proposal form for undisclosed illness. It is not a refusal, but it adds weeks. Section 45 of the Insurance Act prevents a policy from being questioned on any ground after three years from issue.',
        ],
      },
    ],
    related: ['nominee-vs-legal-heir', 'documents-needed-to-claim-deceased-money', 'claim-epf-after-death'],
  },
  {
    slug: 'claim-epf-after-death',
    title: 'How to claim EPF after an employee\'s death',
    description:
      'The three EPFO claims a family makes after a death — provident fund, pension and the EDLI insurance benefit — which form each needs, who can claim, and how to file.',
    h1: 'How do I claim my father\'s EPF after his death?',
    updated: '2026-08-31',
    answer:
      'There are three separate benefits, and families routinely claim only the first. The provident fund balance is claimed with Form 20. The monthly pension under the Employees\' Pension Scheme is claimed with Form 10D. And the insurance benefit under the EDLI scheme — up to seven lakh rupees, paid on death in service — is claimed with Form 5(IF). '
      + 'All three go through the employer or directly to the EPFO, with the death certificate and the claimant\'s KYC and bank details.',
    sections: [
      {
        heading: 'The three claims',
        body: [
          'Form 20 releases the accumulated provident fund balance to the nominee, or to the family members and legal heirs if there was no nomination. Form 10D starts the monthly pension to the widow or widower and to children under twenty-five. Form 5(IF) claims the EDLI benefit, a lump sum linked to the deceased\'s wages, payable when the death occurred while in service — which is missed most often.',
          'The Employees\' Provident Funds Scheme was restructured in 2026, and form numbering should be confirmed against the current scheme before filing. Our rule sets carry a review date for exactly this reason.',
        ],
      },
      {
        heading: 'Documents and filing',
        body: [
          'The death certificate, the claimant\'s Aadhaar, PAN and a cancelled cheque, and the deceased\'s UAN. Where the claimant is a minor, the guardian claims. File through the last employer, who attests, or directly online through the EPFO member portal where the UAN is Aadhaar-linked. If the employer has closed down, the EPFO regional office accepts the claim with a bank attestation instead.',
        ],
      },
      {
        heading: 'What families miss',
        body: [
          'The EDLI benefit, because nobody at the employer mentions it. The pension, because Form 10D is separate from Form 20. And gratuity, which is not an EPFO benefit at all but is owed by the employer under a different Act — see our guide on gratuity after a death.',
        ],
      },
    ],
    related: ['claim-gratuity-after-death', 'claim-family-pension-after-death', 'documents-needed-to-claim-deceased-money'],
  },
  {
    slug: 'claim-ppf-after-death',
    title: 'How to claim a PPF account after the holder\'s death',
    description:
      'What happens to a Public Provident Fund account when the holder dies, how the nominee or legal heirs claim it, the five-lakh threshold, and why the account cannot simply be continued.',
    h1: 'How do I claim my father\'s PPF account after his death?',
    updated: '2026-08-31',
    answer:
      'A PPF account ends at the holder\'s death — it cannot be continued or transferred, and no further deposits are accepted. The balance, with interest to the end of the month before closure, is paid to the nominee on the death certificate and KYC. '
      + 'With no nominee, the legal heirs claim it: up to five lakh rupees on an affidavit, indemnity and NOCs, and above that on a succession certificate or legal heir certificate.',
    sections: [
      {
        heading: 'The nominee route',
        body: [
          'The nominee submits the account\'s claim form, the death certificate, the original passbook and their own identity and bank proof to the bank or post office holding the account. Where several nominees were named, each claims their stated share. The balance is paid out and the account closed.',
        ],
      },
      {
        heading: 'With no nominee',
        body: [
          'Under the Government Savings Promotion General Rules, a claim up to five lakh rupees is settled against an affidavit of heirship, a letter of disclaimer from the other heirs and an indemnity bond, or against a legal heir certificate. Above five lakh, a succession certificate, probate or letters of administration is required. Confirm the current threshold with the office; it has been raised before.',
        ],
      },
      {
        heading: 'Interest, tax and the lock-in',
        body: [
          'Interest is credited to the end of the month preceding the month of closure, not to the date of death. The proceeds remain exempt from income tax in the claimant\'s hands, as PPF withdrawals are. The fifteen-year lock-in does not apply to a claim on death — the account is closed whatever its age.',
        ],
      },
    ],
    related: ['claim-post-office-savings-after-death', 'nominee-vs-legal-heir', 'succession-certificate-india'],
  },
  {
    slug: 'claim-mutual-funds-after-death',
    title: 'How to claim mutual funds after the investor\'s death',
    description:
      'Transmission of mutual fund units to a nominee or the legal heirs in India: which form, the documents CAMS and KFintech ask for, the no-nominee route, and how to find all the folios.',
    h1: 'How do I claim my father\'s mutual funds after his death?',
    updated: '2026-08-31',
    answer:
      'Mutual fund units pass by "transmission" — the units are moved into the nominee\'s or legal heir\'s name, who can then redeem or hold them. With a nominee it is the transmission request form, the death certificate and the nominee\'s KYC, submitted to the fund house or its registrar, CAMS or KFintech. '
      + 'With no nominee, the legal heirs add an affidavit, NOCs and an indemnity, and a succession certificate above the threshold. Find every folio first: many families miss some.',
    sections: [
      {
        heading: 'Finding all the folios',
        body: [
          'Request a consolidated account statement across all fund houses using the deceased\'s PAN, through CAMS or KFintech, or through MFCentral. It lists every folio, including ones the family did not know about. Dividends and redemptions also show in the deceased\'s Form 26AS and annual information statement, which is another way to spot a forgotten holding.',
        ],
      },
      {
        heading: 'The transmission claim',
        body: [
          'For each fund house, the standard transmission request form (AMFI\'s T3 format is widely used) with the death certificate, the claimant\'s KYC, PAN and a cancelled cheque. A nominee submits just these. Where units were held jointly, the surviving holder submits the death certificate and the units continue in their name.',
          'Without a nominee, the legal heirs add an affidavit of heirship, NOCs from the other heirs and an indemnity bond, and the fund house transmits up to a threshold on those alone. Above it, a succession certificate, probate or letters of administration is required. Once the units are in the claimant\'s name, they can be redeemed; capital gains are computed from the original purchase date and cost, since transmission is not a taxable transfer.',
        ],
      },
    ],
    related: ['transfer-shares-after-death', 'nominee-vs-legal-heir', 'find-deceased-accounts-and-investments'],
  },
  {
    slug: 'transfer-shares-after-death',
    title: 'How to transfer shares after a shareholder\'s death',
    description:
      'Transmission of demat and physical shares to a nominee or the legal heirs in India: the transmission request form, SEBI\'s simplified threshold, and the physical-share route through the registrar.',
    h1: 'How do I transfer my father\'s shares to my name after his death?',
    updated: '2026-08-31',
    answer:
      'Shares pass by transmission, not transfer. For a demat account, the nominee or legal heir submits a transmission request form to the depository participant with the death certificate and their KYC; a new demat account in the claimant\'s name receives the securities. '
      + 'Without a nominee, SEBI lets the DP transmit on an affidavit, NOCs and indemnity up to a prescribed value, currently fifteen lakh rupees, and requires a succession certificate above it. Physical share certificates go through each company\'s registrar instead.',
    sections: [
      {
        heading: 'Demat shares',
        body: [
          'Open a demat account in the claimant\'s name if there is not one. Submit the DP\'s transmission request form, the death certificate and the claimant\'s KYC. A registered nominee needs nothing more. A surviving joint holder likewise, and the securities continue in their name.',
          'Where there is no nominee, the legal heirs add an affidavit of heirship, a no-objection certificate from each other heir, and an indemnity bond. SEBI\'s operational guidelines allow transmission on these alone up to fifteen lakh rupees in value — a figure that has been raised before, so confirm the current one. Above it, a succession certificate, probate or letters of administration must be produced.',
        ],
      },
      {
        heading: 'Physical share certificates',
        body: [
          'Old paper certificates are handled by each company\'s registrar and transfer agent, company by company, with the original certificates, the death certificate and the same heirship documents. Since physical shares can no longer be traded, the sensible end point is to have them dematerialised into the claimant\'s account as part of the transmission.',
          'If dividends on a holding went unclaimed for seven years, the shares may already have been moved to the Investor Education and Protection Fund — a different process, covered in our IEPF guide.',
        ],
      },
    ],
    related: ['iepf-share-claim', 'claim-mutual-funds-after-death', 'nominee-vs-legal-heir'],
  },
  {
    slug: 'claim-nps-after-death',
    title: 'How to claim NPS after the subscriber\'s death',
    description:
      'What happens to a National Pension System account when the subscriber dies, who receives the corpus, the difference for government employees, and how to file the death withdrawal.',
    h1: 'How do I claim my father\'s NPS account after his death?',
    updated: '2026-08-31',
    answer:
      'For a private-sector or self-employed subscriber, the entire accumulated corpus is paid as a lump sum to the nominee, or to the legal heirs if there was no nomination — there is no compulsory annuity on death. The claim is filed through the subscriber\'s point of presence or nodal office with the death certificate and the claimant\'s KYC and bank proof. '
      + 'Government-sector subscribers\' families are treated differently, with a family pension option under the government\'s rules.',
    sections: [
      {
        heading: 'Who receives the corpus',
        body: [
          'The nominee recorded in the account, in the shares stated. If no nominee was registered, the legal heirs, on a legal heir certificate or succession certificate depending on the amount and the nodal office\'s requirements. For all-citizen and corporate subscribers the full corpus is withdrawable; the rule that part of the corpus must buy an annuity applies to the subscriber\'s own exit, not to a death.',
        ],
      },
      {
        heading: 'Filing the claim',
        body: [
          'The death withdrawal form is submitted to the point of presence, bank or nodal office that services the account, with the death certificate, the claimant\'s identity and address proof, PAN, a cancelled cheque, and the subscriber\'s PRAN details. The nodal office verifies and forwards it to the central recordkeeping agency, which processes the payout to the claimant\'s bank account.',
        ],
      },
      {
        heading: 'Government employees',
        body: [
          'Families of central and many state government subscribers can opt for a family pension under the government\'s own rules instead of the NPS corpus, in which case the accumulated NPS amount is returned to the government. Which option is better depends on the family\'s circumstances and is worth a careful comparison before choosing, because it is not reversible.',
        ],
      },
    ],
    related: ['claim-family-pension-after-death', 'claim-epf-after-death', 'nominee-vs-legal-heir'],
  },
  {
    slug: 'claim-post-office-savings-after-death',
    title: 'How to claim post office savings, NSC or KVP after death',
    description:
      'Claiming a deceased person\'s post office savings account, recurring or time deposit, NSC, KVP or monthly income scheme: nominee and no-nominee routes and the five-lakh threshold.',
    h1: 'How do I claim my mother\'s post office savings and NSC after her death?',
    updated: '2026-08-31',
    answer:
      'All post office savings schemes — the savings account, recurring and time deposits, NSC, KVP, the monthly income scheme and the senior citizens\' scheme — follow one set of rules. A nominee claims on the death certificate, the passbook or certificate, and their KYC. '
      + 'Without a nominee, the legal heirs claim up to five lakh rupees on an affidavit, indemnity and letter of disclaimer, and need a succession certificate above that.',
    sections: [
      {
        heading: 'The nominee route',
        body: [
          'Submit the post office\'s claim form for a deceased depositor at the branch holding the account, with the death certificate, the original passbook or certificates, and the nominee\'s identity, address and bank proof. The amount, with interest to the date of payment under the scheme\'s rules, is paid to the nominee\'s account and the account or certificate is closed.',
        ],
      },
      {
        heading: 'Without a nominee',
        body: [
          'Under the Government Savings Promotion General Rules, a claim up to five lakh rupees is settled by the postmaster against an affidavit of heirship, a letter of disclaimer from the other legal heirs, and an indemnity bond — or against a legal heir certificate. Above five lakh, a succession certificate, probate or letters of administration is required. The threshold has been raised more than once, so confirm the current figure.',
          'Certificates such as NSC and KVP held in physical form must be produced. If they are lost, the post office issues a duplicate against an indemnity before the claim can proceed, which adds time.',
        ],
      },
    ],
    related: ['claim-ppf-after-death', 'claim-fixed-deposit-after-death', 'affidavit-of-heirship-how-to-write'],
  },
  {
    slug: 'claim-fixed-deposit-after-death',
    title: 'How to claim a fixed deposit after the depositor\'s death',
    description:
      'Claiming a deceased family member\'s fixed deposit in India: the nominee and survivor routes, premature closure without penalty, interest to the date of payment, and joint deposits.',
    h1: 'How do I claim my father\'s fixed deposit after his death?',
    updated: '2026-08-31',
    answer:
      'A fixed deposit is claimed like a savings account, with one useful difference: it can be closed early on the depositor\'s death without the usual premature-withdrawal penalty, or left to run to maturity, at the claimant\'s choice. '
      + 'The nominee or surviving joint holder claims on the death certificate, the deposit receipt and their KYC. Without either, the legal heirs use the affidavit, NOC and indemnity route below the bank\'s limit, and a succession certificate above it.',
    sections: [
      {
        heading: 'Nominee or survivor',
        body: [
          'A registered nominee submits the bank\'s claim form, the death certificate, the original deposit receipt and their identity, address and bank proof. A surviving joint holder of a deposit held "either or survivor" or "former or survivor" simply continues as the holder on the death certificate — no claim form is needed, though the survivor still holds the money subject to the heirs\' rights.',
        ],
      },
      {
        heading: 'Closing early, or letting it run',
        body: [
          'The Reserve Bank directs banks not to charge a premature withdrawal penalty when a deposit is closed on the depositor\'s death, and to pay interest at the contracted rate to the date of payment — or, for a deposit that had matured, at the savings rate for the period after maturity. If the rate is good and the money is not needed, the claimant can instead leave the deposit to maturity, transferred into their name.',
        ],
      },
      {
        heading: 'Without a nominee',
        body: [
          'Below the bank\'s internal limit: an affidavit of heirship, NOCs from the other heirs and an indemnity bond, often with a legal heir certificate. Above the limit, a succession certificate from a civil court. A large fixed deposit with no nomination is the single most common reason a family ends up needing one — which is exactly what registering a nominee prevents.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'joint-account-one-holder-died', 'succession-certificate-india'],
  },
  {
    slug: 'open-bank-locker-after-death',
    title: 'How to open a bank locker after the holder\'s death',
    description:
      'Accessing a deceased family member\'s bank locker in India under the RBI\'s locker rules: nominee and survivor access, the no-nominee route, and the inventory the bank takes.',
    h1: 'How do I open my father\'s bank locker after his death?',
    updated: '2026-08-31',
    answer:
      'A registered nominee, or the surviving holder of a jointly held locker, is given access on the death certificate and their identity proof. Without either, the legal heirs get access on the bank\'s no-nominee documents — typically an affidavit, NOCs and an indemnity, and for anything substantial a succession certificate or legal heir certificate. '
      + 'In every case the bank opens the locker in the presence of the claimants and makes an inventory of the contents before handing them over.',
    sections: [
      {
        heading: 'Nominee or joint holder',
        body: [
          'The Reserve Bank\'s 2021 locker rules require banks to give a nominee, or a surviving joint holder where the locker was operated jointly, access on the death certificate and their own identification, after the bank verifies the death. The bank opens the locker with the claimant present, prepares an inventory of the contents, has the claimant sign it, and releases the contents. Its role ends there; it does not decide who owns what is inside.',
        ],
      },
      {
        heading: 'Without a nominee',
        body: [
          'The legal heirs must establish their entitlement with the bank\'s prescribed documents — an affidavit of heirship, no-objection letters from the other heirs and an indemnity bond, often with a legal heir certificate. Where the heirs disagree, or the bank\'s policy requires it for the value likely inside, a succession certificate. The contents are then inventoried and released to the heirs jointly, or to the one they authorise.',
          'A locker key that cannot be found is broken open by the bank at the claimant\'s cost, in their presence, once entitlement is established.',
        ],
      },
    ],
    related: ['claim-bank-account-after-death', 'noc-from-legal-heirs', 'legal-heir-certificate'],
  },
  {
    slug: 'claim-family-pension-after-death',
    title: 'How to claim family pension after a pensioner\'s death',
    description:
      'Claiming family pension after the death of a government pensioner or employee in India: who is eligible, Form 14, the documents, and the separate EPS pension for private-sector employees.',
    h1: 'How do I claim family pension after my husband\'s death?',
    updated: '2026-08-31',
    answer:
      'If the deceased was a central or state government employee or pensioner, the surviving spouse applies to the pension-paying bank or the pension sanctioning authority, on Form 14 for central government cases, with the death certificate and a copy of the pension payment order. '
      + 'If the deceased was in the private sector and a member of the Employees\' Pension Scheme, the family pension is instead claimed from the EPFO on Form 10D — a different scheme and a different office.',
    sections: [
      {
        heading: 'Government service: who is eligible and how to claim',
        body: [
          'The spouse first, for life or until remarriage. Then children, in order of birth, until they reach twenty-five or marry, and permanently for a child unable to earn a livelihood because of disability. Dependent parents in certain cases. Where the pension was already being paid jointly to the pensioner and spouse, the bank usually starts family pension to the spouse on the death certificate and a simple application, without a fresh sanction.',
          'Otherwise the spouse submits Form 14, or the state\'s equivalent, to the pension sanctioning authority through the last office, with the death certificate, a copy of the pension payment order, the claimant\'s identity and bank proof, and a photograph. The department issues a fresh pension payment order in the family pensioner\'s name.',
        ],
      },
      {
        heading: 'Private sector: the EPS pension',
        body: [
          'Under the Employees\' Pension Scheme 1995, the widow or widower receives a monthly pension for life, and children under twenty-five receive a share. It is claimed from the EPFO on Form 10D through the last employer or online, with the death certificate and the claimant\'s KYC and bank proof. It is separate from — and additional to — the provident fund balance claimed on Form 20.',
        ],
      },
    ],
    related: ['claim-epf-after-death', 'claim-gratuity-after-death', 'husband-died-without-will-what-am-i-entitled-to'],
  },
  {
    slug: 'claim-gratuity-after-death',
    title: 'How to claim gratuity after an employee\'s death',
    description:
      'Gratuity after death in India: why the five-year rule does not apply, who the employer pays, Form J and Form K, the 30-day deadline, and leave encashment and other dues.',
    h1: 'How do I claim my husband\'s gratuity after his death?',
    updated: '2026-08-31',
    answer:
      'Gratuity is owed by the employer, not the provident fund office, and it is payable on death even if the employee had not completed five years of service — the usual qualifying period is waived. The nominee recorded with the employer claims on Form J; if there was no nomination, the legal heirs claim on Form K. '
      + 'The employer must pay within thirty days of the amount becoming due, with interest if late.',
    sections: [
      {
        heading: 'What is owed, and to whom',
        body: [
          'Under the Payment of Gratuity Act 1972, an employee who dies in service is entitled to gratuity regardless of length of service, calculated at fifteen days\' wages for each completed year. It is paid to the nominee named in the employee\'s gratuity nomination (Form F), which most employers take on joining. Where the nominee is a minor, the amount is deposited with the controlling authority and invested for them until they come of age. With no nomination, it is paid to the legal heirs.',
        ],
      },
      {
        heading: 'How to claim',
        body: [
          'The nominee applies to the employer on Form J, or the legal heirs on Form K, within thirty days of the amount becoming due — though a late application is not fatal. Attach the death certificate, the claimant\'s identity and bank proof, and proof of relationship. The employer must determine the amount and pay within thirty days; if it does not, simple interest runs, and the claimant can apply to the controlling authority under the Act to compel payment.',
        ],
      },
      {
        heading: 'The other dues from an employer',
        body: [
          'Leave encashment for unused leave, salary up to the date of death, any bonus due, and reimbursements. These follow the employer\'s own rules and the employment terms rather than a statute, but they are owed, and an employer settling gratuity should be asked for a full and final settlement covering all of them at the same time.',
        ],
      },
    ],
    related: ['claim-epf-after-death', 'claim-family-pension-after-death', 'documents-needed-to-claim-deceased-money'],
  },
  {
    slug: 'joint-account-one-holder-died',
    title: 'Joint bank account when one holder dies: who owns it',
    description:
      'What happens to a joint bank account or deposit in India when one holder dies: either-or-survivor, former-or-survivor and jointly-operated accounts, and the difference between operating the account and owning the money.',
    h1: 'One holder of our joint account has died. Who owns it now?',
    updated: '2026-08-31',
    answer:
      'It depends on the operating instruction on the account. With "either or survivor" or "former or survivor", the surviving holder continues to operate the account and receives the balance on the death certificate, with no claim process. With an account operated "jointly", there is no survivorship, and the deceased\'s share is claimed by their legal heirs. '
      + 'In every case, though, survivorship decides who the bank pays — not who ultimately owns the money, which is a question of succession.',
    sections: [
      {
        heading: 'The three operating instructions',
        body: [
          'Either or survivor: either holder may operate; on one death, the survivor continues, and the bank pays the survivor on the death certificate. Former or survivor: only the first-named holder operates during their lifetime; on their death, the survivor takes over. Jointly: both must sign; on one death, the survivor cannot operate alone, and the balance is paid to the survivor together with the deceased\'s legal heirs, or on their NOCs.',
          'The Reserve Bank directs banks to honour survivorship instructions without insisting on a succession certificate, so a survivor who is refused should escalate.',
        ],
      },
      {
        heading: 'Operating is not the same as owning',
        body: [
          'Survivorship is a payment mechanism. It lets the bank hand the money to the surviving holder without adjudicating who is entitled to it. Whether the survivor keeps it depends on whose money it was and on the succession law that applies — a joint account between husband and wife is usually the wife\'s in practice, but a joint account between a father and one son is not the son\'s alone if he has siblings. Where it matters, record the intended position in a family settlement rather than assuming.',
        ],
      },
    ],
    related: ['claim-fixed-deposit-after-death', 'nominee-vs-legal-heir', 'father-died-does-mother-get-everything'],
  },
  {
    slug: 'what-happens-to-loans-after-death',
    title: 'What happens to a person\'s loans after their death',
    description:
      'What happens to a deceased person\'s home loan, personal loan and credit card debt in India, whether the family has to pay, loan insurance, and how the estate settles debts before heirs inherit.',
    h1: 'What happens to my father\'s loans after his death?',
    updated: '2026-08-31',
    answer:
      'Debts do not die with the person, but they are paid from what the person left, not from the family\'s own money. Legal heirs are liable only up to the value of what they inherit — never beyond it. A secured loan such as a home or car loan is either continued by a co-borrower or heir who takes the asset, or the lender sells the asset to recover it. '
      + 'An unsecured loan or card balance is a claim against the estate, paid before the heirs receive anything. Check first whether the loan was insured; many are, and the cover clears the debt.',
    sections: [
      {
        heading: 'The rule: liability is limited to the inheritance',
        body: [
          'A lender can recover from the deceased\'s estate — the accounts, investments and property they left. It cannot recover from an heir\'s own savings or salary. If the estate is smaller than the debts, the lender bears the shortfall. So a family that inherits nothing owes nothing, and a family that inherits ten lakh rupees is exposed at most to ten lakh, however large the loans were. Debts are settled first; heirs take what remains.',
        ],
      },
      {
        heading: 'Secured loans: home, car, gold',
        body: [
          'The asset secures the loan. A co-borrower — typically a spouse — remains liable and usually continues paying. Otherwise the heir who wants to keep the house or car takes over the loan, subject to the lender\'s assessment. If nobody does, the lender sells the asset and recovers the balance, returning any surplus to the estate. Inform the lender promptly; a loan that goes silently into default loses the family its options.',
        ],
      },
      {
        heading: 'Loan insurance, and what to do first',
        body: [
          'Many home and personal loans carry a credit-life or loan protection cover that pays the outstanding balance on the borrower\'s death. Ask the lender specifically whether the loan was insured — the family is not always told. Where it was, the claim is made to the insurer with the death certificate, and the debt is cleared without touching the estate. Gather every loan statement, inform each lender in writing with the death certificate, and do not let anyone pressure a grieving family into paying from their own pockets.',
        ],
      },
    ],
    related: ['find-deceased-accounts-and-investments', 'claim-lic-policy-after-death', 'documents-needed-to-claim-deceased-money'],
  },
  {
    slug: 'find-deceased-accounts-and-investments',
    title: 'How to find a deceased person\'s accounts and investments',
    description:
      'How to trace every bank account, deposit, insurance policy, mutual fund, share and provident fund a deceased family member held in India, using their tax records and the official search portals.',
    h1: 'How do I find out what accounts and investments my father had?',
    updated: '2026-08-31',
    answer:
      'Start with the paper: bank statements, passbooks, policy documents, and the deceased\'s email and phone, which carry statements and alerts. Then use their PAN, which unlocks the official trails — the income tax annual information statement lists every account that paid interest and every fund that paid a dividend, '
      + 'and the consolidated statements from the depositories and mutual fund registrars list every holding. Finally, search the unclaimed-asset portals: the RBI\'s UDGAM for bank deposits, the IEPF for shares, and the insurers\' lost-policy services.',
    sections: [
      {
        heading: 'The tax records are the master list',
        body: [
          'The deceased\'s Form 26AS and annual information statement on the income tax portal show every institution that reported interest, dividends or a large transaction against their PAN. That surfaces bank accounts, deposits, mutual funds and shares the family never knew about. Their last few income tax returns list interest income and dividend income by source. Access needs the deceased\'s portal login, or a legal heir registration on the portal, which the tax department allows on the death certificate and proof of heirship.',
        ],
      },
      {
        heading: 'Consolidated statements',
        body: [
          'Request a consolidated account statement from NSDL or CDSL, which lists every demat account and holding against the PAN, and from CAMS or KFintech, which lists every mutual fund folio across fund houses. The EPFO member portal shows the provident fund account against the UAN. Each of these is a single request that replaces contacting institutions one by one.',
        ],
      },
      {
        heading: 'The unclaimed-asset portals',
        body: [
          'Bank deposits untouched for ten years are transferred to the Reserve Bank\'s Depositor Education and Awareness Fund, and can be searched by name across banks on the RBI\'s UDGAM portal. Shares whose dividends went unclaimed for seven years are transferred to the Investor Education and Protection Fund, searchable on the IEPF website by name and company. Insurers maintain lost-policy search facilities, and the IRDAI\'s Bima Bharosa portal handles unresolved claims. A search on each takes minutes and regularly finds money the family had no idea existed.',
        ],
      },
    ],
    related: ['claim-unclaimed-deposits-udgam', 'iepf-share-claim', 'claim-mutual-funds-after-death'],
  },
  {
    slug: 'claim-unclaimed-deposits-udgam',
    title: 'How to claim unclaimed deposits through RBI\'s UDGAM',
    description:
      'Using the Reserve Bank\'s UDGAM portal to find a deceased family member\'s unclaimed bank deposits across banks, what happens to deposits idle for ten years, and how to claim them from the bank.',
    h1: 'How do I claim my father\'s unclaimed bank deposits through UDGAM?',
    updated: '2026-08-31',
    answer:
      'UDGAM is the Reserve Bank\'s search portal for unclaimed deposits. A deposit untouched for ten years is transferred by the bank to the RBI\'s Depositor Education and Awareness Fund, but the depositor\'s or heirs\' right to it never lapses. Search the portal by the deceased\'s name to find such deposits across the participating banks, '
      + 'then claim from the bank concerned with the death certificate and the usual heirship documents — the bank recovers the amount from the fund and pays you.',
    sections: [
      {
        heading: 'What UDGAM shows',
        body: [
          'Register on udgam.rbi.org.in with a mobile number, then search by the account holder\'s name, with optional filters such as PAN, date of birth or passport number to narrow the results. The portal lists matching unclaimed deposits at each participating bank, with the branch. It covers most major banks, and coverage has been expanding; a deposit at a bank not yet on the portal must be traced through that bank directly.',
        ],
      },
      {
        heading: 'Claiming from the bank',
        body: [
          'The claim is made to the bank, not to the RBI. Approach the branch shown with the death certificate, the deceased\'s identity details, and the documents the bank\'s deceased-claim process requires — the nominee\'s KYC if there was a nominee, or the affidavit, NOC and indemnity route otherwise. The bank verifies, claims the amount back from the fund, and pays it with the interest the fund has accrued. The ten-year transfer changes where the money is held, not who is entitled to it.',
        ],
      },
    ],
    related: ['find-deceased-accounts-and-investments', 'claim-bank-account-after-death', 'iepf-share-claim'],
  },
  {
    slug: 'mother-passed-away-who-inherits',
    title: 'Who inherits when a mother dies without a will in India',
    description:
      'Who inherits a Hindu woman\'s money and property when she dies without a will: the fixed order under section 15, why inherited property goes back to its source, and what her husband and children each get.',
    h1: 'My mother passed away. Who inherits her money?',
    updated: '2026-08-31',
    answer:
      'For a Hindu woman who dies without a will, section 15 of the Hindu Succession Act sets a fixed order: her sons, daughters and husband first, all taking equally. If none of them survive, her husband\'s heirs; then her own mother and father; then her father\'s heirs; then her mother\'s. '
      + 'One exception matters constantly: anything she had inherited from her own parents goes back to her father\'s heirs if she leaves no children, and anything from her husband or in-laws goes back to his.',
    sections: [
      {
        heading: 'The usual case: husband and children take equally',
        body: [
          'Where the mother leaves a husband and children, section 15(1)(a) gives all of them the estate, and section 16 has them share equally — the husband and each child one share alike. A daughter\'s share equals a son\'s. A child who died before her is represented by their own children, who take that child\'s share between them. If she was a widow, the children take everything equally.',
        ],
      },
      {
        heading: 'The provenance rule',
        body: [
          'Section 15(2) reverses the order for property she inherited rather than earned or was given. Property that came to her from her mother or father returns to her father\'s heirs if she leaves no son or daughter — regardless of a surviving husband. Property that came from her husband or father-in-law returns to her husband\'s heirs in the same situation. Where she leaves children, this does not bite; where she does not, it decides the case, and it depends on tracing where each asset came from.',
        ],
      },
      {
        heading: 'What it means in practice',
        body: [
          'Her bank accounts, deposits and investments are claimed by the husband and children as the legal heirs, in equal shares, using the documents each institution requires. A nominee on any account collects it for them but does not keep it. If there is a will, it governs instead, and if she was Christian, Muslim or Parsi a different law applies — see our guide on inheritance from a sister, which covers those differences.',
        ],
      },
    ],
    related: ['claim-inheritance-when-sister-dies', 'hindu-succession-shares', 'father-died-does-mother-get-everything'],
  },
  {
    slug: 'husband-died-without-will-what-am-i-entitled-to',
    title: 'Husband died without a will: what a widow is entitled to',
    description:
      'A widow\'s share when her husband dies without a will in India under the Hindu Succession Act: one share alongside each child and his mother, what she keeps outright, and the nominee trap.',
    h1: 'My husband died without a will. What am I entitled to?',
    updated: '2026-08-31',
    answer:
      'As a widow you are a Class I heir, and you inherit alongside your children and your husband\'s mother, each of you taking one equal share of his self-acquired property. You do not automatically get everything — only if he left no children and his mother has also died. '
      + 'Your own property, your stridhan and anything held in your own name stays yours entirely. And being nominee on his accounts lets you collect them, but the shares above still apply.',
    sections: [
      {
        heading: 'Your share',
        body: [
          'Under sections 8 and 10 of the Hindu Succession Act, the Class I heirs of a man who dies without a will are his widow, his children, and his mother, and they take simultaneously. The widow takes one share, each child one share, and the mother one share. With two children and a surviving mother-in-law, that is four equal shares and yours is one quarter. With two children and no surviving mother-in-law, one third. With no children and no mother-in-law, everything.',
          'If your husband had more than one widow — a situation the Act addresses — all the widows together take the one widow\'s share, divided among them. Children of a child who died before him take that child\'s share.',
        ],
      },
      {
        heading: 'What is yours regardless',
        body: [
          'Everything in your own name, your stridhan — gifts and jewellery given to you — and your share of any joint property you contributed to. None of that is part of his estate and none of it is divided. Your right to live in the matrimonial home is also protected, whatever the shares in it.',
        ],
      },
      {
        heading: 'Nomination, and the family pension',
        body: [
          'If you were nominee on his accounts and policies, you collect them quickly, but you hold the other heirs\' shares for them; record the division in an affidavit at the same time to protect yourself. Separately, if he was a government employee or a member of the Employees\' Pension Scheme, you are entitled to a family pension for life — claimed separately, and often forgotten.',
        ],
      },
    ],
    related: ['father-died-does-mother-get-everything', 'claim-family-pension-after-death', 'nominee-vs-legal-heir'],
  },
  {
    slug: 'father-died-does-mother-get-everything',
    title: 'Father died: does the mother get everything, or is it split',
    description:
      'When a Hindu man dies without a will, his widow does not inherit everything: the estate is divided equally between her, each child and his mother. What the split is, and what to do about it.',
    h1: 'My father died. Does my mother get everything, or is it divided between us?',
    updated: '2026-08-31',
    answer:
      'It is divided. When a Hindu man dies without a will, his widow, each of his children, and his own mother if she is alive all inherit together, one equal share each. Your mother does not receive everything unless she is the only one of those people left. '
      + 'Many families choose to leave everything with the mother in practice, and that is entirely their right — but it should be done deliberately, with the children\'s shares recorded and released, not assumed.',
    sections: [
      {
        heading: 'The split the law makes',
        body: [
          'Section 10 of the Hindu Succession Act distributes a man\'s self-acquired property among his Class I heirs: the widow one share, each son and daughter one share, and his mother one share. A family of a widow and three children, where the man\'s own mother has died, has four equal shares — one quarter each. Sons and daughters take exactly the same, whether married or not.',
        ],
      },
      {
        heading: 'If the family wants the mother to have it',
        body: [
          'Nothing stops the children from letting their mother keep everything, and it is common and kind. The clean way to do it is for each child to release their share to her in a written family settlement or release deed, so the institutions can pay her and no child can later be accused of having been done out of a share. The messy way — everyone simply agreeing verbally while the accounts are settled in her name as nominee — leaves the shares legally undistributed and invites a dispute years later.',
        ],
      },
      {
        heading: 'Ancestral property is different',
        body: [
          'The split above is for what your father acquired himself. Ancestral property — inherited undivided through the male line — is a coparcenary in which the children, sons and daughters alike since the 2005 amendment, already hold a share by birth. That share was theirs before he died, and only his own share in it passes by succession. Distinguishing the two is often the hardest question in a family\'s estate, and one to have an advocate confirm.',
        ],
      },
    ],
    related: ['husband-died-without-will-what-am-i-entitled-to', 'hindu-succession-shares', 'married-daughter-claim-fathers-money'],
  },
  {
    slug: 'brother-died-unmarried-who-inherits',
    title: 'Unmarried brother died: who inherits his money',
    description:
      'Who inherits when an unmarried Hindu man dies without a will: why his mother takes everything if she is alive, when his father inherits, and when brothers and sisters share it.',
    h1: 'My brother died unmarried. Who gets his money?',
    updated: '2026-08-31',
    answer:
      'For an unmarried Hindu man with no children, the answer turns on whether his mother is alive. She is a Class I heir and, with no widow or children to share with, she takes everything. If she has died, his father inherits as the first Class II heir. '
      + 'Only if both parents are gone does the estate pass to his brothers and sisters, who share it equally. Siblings are further down the list than most families expect.',
    sections: [
      {
        heading: 'The order',
        body: [
          'Section 8 of the Hindu Succession Act gives a man\'s estate first to his Class I heirs — widow, children, and mother. An unmarried man with no children has one possible Class I heir, his mother, and she takes the whole estate. Note that his father is not a Class I heir. If the mother has died, the estate goes to the Class II heirs in order of entry, and the first entry is the father alone. Only when the father has also died does the second entry apply: brothers, sisters, and the children of a deceased child — who share equally.',
        ],
      },
      {
        heading: 'What this means for a claim',
        body: [
          'A brother handling the paperwork usually assumes he and his siblings are the heirs. If either parent is alive, that is wrong, and a claim filed in the siblings\' names will be rejected — or worse, paid and later disputed. The parent is the claimant, and the siblings sign no-objection letters or act on the parent\'s behalf. A nominee on any of his accounts collects for whoever the heir is; the nominee does not become the owner.',
        ],
      },
      {
        heading: 'A will, or another community',
        body: [
          'A valid will overrides all of this. If your brother was Christian, the Indian Succession Act applies and parents and siblings are treated differently. If he was Muslim, the shares follow personal law and should be computed by an advocate. The free check applies the right rules to your family and tells you who the claimant actually is.',
        ],
      },
    ],
    related: ['hindu-succession-shares', 'claim-inheritance-when-sister-dies', 'noc-from-legal-heirs'],
  },
  {
    slug: 'married-daughter-claim-fathers-money',
    title: 'Can a married daughter claim her father\'s money in India',
    description:
      'A married daughter\'s inheritance rights under the Hindu Succession Act: an equal share with her brothers in her father\'s self-acquired property, and a share by birth in ancestral property since 2005.',
    h1: 'Can a married daughter claim her father\'s money after his death?',
    updated: '2026-08-31',
    answer:
      'Yes, and on exactly the same terms as a son. A daughter is a Class I heir of her father whether she is married or not, and she takes one full share of his self-acquired property, equal to each brother\'s. Marriage changes nothing. '
      + 'Since the 2005 amendment she is also a coparcener in ancestral property by birth, with the same rights as a son — confirmed by the Supreme Court in Vineeta Sharma v Rakesh Sharma (2020), regardless of when her father died.',
    sections: [
      {
        heading: 'Self-acquired property: an equal share',
        body: [
          'The Hindu Succession Act has always listed daughters among a man\'s Class I heirs alongside sons, and section 10 gives each child one equal share. A married daughter\'s share is not reduced, forfeited or conditional. The idea that a daughter "belongs to her husband\'s family" has no basis in the Act, and an affidavit of heirship that leaves out married daughters is the commonest reason a family\'s claim is rejected or later challenged.',
        ],
      },
      {
        heading: 'Ancestral property: a share by birth',
        body: [
          'In undivided ancestral property, the 2005 amendment to section 6 made daughters coparceners by birth, with the same rights and liabilities as sons. The Supreme Court settled in Vineeta Sharma v Rakesh Sharma (2020) that this applies whether or not the father was alive on the date of the amendment. So a daughter\'s share in ancestral property is hers already, and only the father\'s own share in it passes by succession.',
        ],
      },
      {
        heading: 'If she is being asked to sign it away',
        body: [
          'A daughter may release her share to her mother or brothers if she genuinely chooses to, by a written release deed. She cannot be required to, and a no-objection letter signed under pressure or without understanding what it gives up can be challenged. Institutions settling a claim need every heir listed and either claiming or consenting; they do not need a daughter to disclaim.',
        ],
      },
    ],
    related: ['hindu-succession-shares', 'father-died-does-mother-get-everything', 'noc-from-legal-heirs'],
  },
  {
    slug: 'grandfather-died-can-grandchildren-claim',
    title: 'Grandfather died: can grandchildren claim a share',
    description:
      'When grandchildren inherit from a grandfather under the Hindu Succession Act: only through a parent who died before him, taking that parent\'s share, and why they get nothing directly if the parent is alive.',
    h1: 'My grandfather died. Can I claim a share of his money?',
    updated: '2026-08-31',
    answer:
      'Only if your parent — his son or daughter — died before him. A grandchild is a Class I heir solely as the child of a predeceased child, and takes the share that parent would have taken, divided among the parent\'s children. '
      + 'If your parent is alive, they inherit from your grandfather and you have no direct claim; what you receive from your parent is a separate question, later. This is the rule that families most often get backwards.',
    sections: [
      {
        heading: 'Representation: taking a dead parent\'s share',
        body: [
          'The Class I list in the Hindu Succession Act includes the son and daughter of a predeceased son or daughter. Under section 10, the widow, children and mother of the deceased each take one share, and the heirs of a predeceased child together take the single share that child would have had. Two grandchildren whose father died before the grandfather therefore split their father\'s share between them; they do not each take a full share alongside their surviving uncles and aunts.',
        ],
      },
      {
        heading: 'If your parent is alive',
        body: [
          'Then your parent is the heir and you are not, for the grandfather\'s self-acquired property. The estate passes to the grandfather\'s widow, children and mother, and your parent\'s share becomes your parent\'s property. You inherit from your parent in due course, not from your grandfather now. An affidavit of heirship for the grandfather\'s estate should list the surviving children, not their children.',
        ],
      },
      {
        heading: 'Ancestral property is the exception',
        body: [
          'In undivided ancestral property, every member of the coparcenary — including grandchildren, and since 2005 granddaughters — holds a share by birth, whether or not their parent is alive. So a grandchild may already have a share in the family\'s ancestral property even while having no succession claim to the grandfather\'s bank account. Which assets are ancestral and which self-acquired is the question to have settled first.',
        ],
      },
    ],
    related: ['hindu-succession-shares', 'father-died-does-mother-get-everything', 'married-daughter-claim-fathers-money'],
  },
] as const;

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
