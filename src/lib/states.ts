/**
 * Legal heir certificate, state by state.
 *
 * Why these pages exist
 * ---------------------
 * A legal heir certificate is a *state* instrument. There is no central act
 * behind it — it is issued under each state's own revenue administration, which
 * means the name, the issuing officer, the portal, the form and the fee all
 * change at the state border. "Legal heir certificate" pulls thousands of
 * searches a month in India, but the question behind the search is always local:
 * Tamil Nadu families are looking for REV-114 on e-Sevai; Delhi families are
 * looking for something that is not called a legal heir certificate at all.
 *
 * The generic national article — which is what most of the internet has
 * published — cannot answer that. These pages can.
 *
 * What we will and will not assert
 * --------------------------------
 * Some facts here are stable and checkable: the issuing authority, the portal,
 * the service name, what the certificate is and is not good for. Those are
 * stated plainly.
 *
 * Fees and timelines are NOT stable. They differ between districts inside the
 * same state, they are quietly revised, and the published figure is routinely
 * not what a family is actually charged once the affidavit, the stamp paper and
 * the service-centre margin are added. So every fee and timeline here is typed
 * as a reported range, is labelled as such on the page, and sits next to the
 * instruction to confirm at the counter. `verifiedOn` makes the age of the
 * claim visible instead of leaving the reader to assume it is current.
 *
 * This mirrors the rule already applied in obtaining.ts: Indian estate procedure
 * is national in statute and local in practice, and a page that reads as one
 * uniform national process sends someone to the wrong office.
 */

export interface StateProcess {
  slug: string;
  /** English name, as it appears in an address. */
  name: string;
  /** What the certificate is actually called there. Often not "legal heir certificate". */
  certificate: string;
  /** The local-language name people use, where there is one. */
  alsoCalled?: string;
  /** Who signs it. */
  authority: string;
  portal: { name: string; url: string };
  /** The state's own service code, where it has one. This is what people search. */
  serviceCode?: string;
  /** Under 60 characters. */
  title: string;
  /** 150-160 characters. */
  description: string;
  /** The H1, phrased as the question someone types. */
  h1: string;
  /** Direct answer, before any detail. */
  answer: string;
  documents: readonly string[];
  /** Reported, not guaranteed. Rendered with that caveat attached. */
  fee: string;
  /** Reported, not guaranteed. */
  timeline: string;
  /** What is genuinely different here and nowhere else. The reason the page exists. */
  localDetail: readonly string[];
  /**
   * Required on every state. What specifically is unreliable about this state's
   * figures, so the caveat is concrete rather than boilerplate.
   */
  varies: string;
  verifiedOn: string;
}

export const STATES: readonly StateProcess[] = [
  // -------------------------------------------------------------- Tamil Nadu
  {
    slug: 'tamil-nadu',
    name: 'Tamil Nadu',
    certificate: 'Legal Heir Certificate',
    alsoCalled: 'Varisu certificate',
    authority: 'Tahsildar, through the Taluk office',
    portal: { name: 'TNeGA e-Sevai', url: 'https://tnesevai.tn.gov.in/' },
    serviceCode: 'REV-114',
    title: 'Legal heir certificate in Tamil Nadu: REV-114',
    description:
      'How to apply for a Tamil Nadu legal heir (Varisu) certificate through e-Sevai '
      + 'as service REV-114, the documents the Taluk office asks for, and what it costs.',
    h1: 'How do I get a legal heir certificate in Tamil Nadu?',
    answer:
      'Apply through the TNeGA e-Sevai portal under the Revenue Department, where the service is '
      + 'listed by its own code, REV-114. It is signed by the Tahsildar of the taluk where the '
      + 'deceased last lived, after a village-level enquiry by the Village Administrative Officer. '
      + 'Tamil Nadu families usually call it a Varisu certificate, and searching for that name, or '
      + 'for REV-114, will find the right service faster than searching for "legal heir certificate".',
    documents: [
      'Death certificate of the deceased',
      'Identity and address proof of the applicant (Aadhaar is accepted)',
      'Proof of relationship for every heir being named — ration card, school records or birth certificates',
      'A self-undertaking affidavit listing all surviving heirs',
      'Address proof of the deceased, establishing the taluk',
    ],
    fee: 'Nominal — the government charge is in the tens of rupees, plus stamp paper for the affidavit',
    timeline: 'Commonly reported at 15 to 30 days, the delay being the VAO enquiry rather than the paperwork',
    localDetail: [
      'The service code REV-114 is the thing worth knowing. e-Sevai lists well over a hundred services and the Revenue Department section is long; going straight to the code avoids picking the wrong certificate.',
      'The enquiry by the Village Administrative Officer is the real timeline, not the form. The VAO verifies the list of heirs locally before the Tahsildar signs. Families who have already gathered relationship proof for every heir named tend to clear this in one visit rather than three.',
      'You can file at a common service centre rather than online, and for many families that is faster — the operator knows which supporting documents that particular taluk insists on.',
    ],
    varies:
      'The fee charged at a common service centre is not the same as the government fee, because the '
      + 'operator adds a service margin, and the affidavit is priced separately. Ask the Taluk office '
      + 'what the current government charge is before assuming any figure published online.',
    verifiedOn: '2026-09-15',
  },

  // --------------------------------------------------------------- Karnataka
  {
    slug: 'karnataka',
    name: 'Karnataka',
    certificate: 'Surviving Family Member Certificate',
    alsoCalled: 'Vamsha Vruksha, for the separate family-tree certificate',
    authority: 'Tahsildar, through the Nadakacheri (Atalji Janasnehi Kendra) centres',
    portal: { name: 'Nadakacheri', url: 'https://nadakacheri.karnataka.gov.in/' },
    title: 'Legal heir certificate in Karnataka: Nadakacheri',
    description:
      'Karnataka issues a Surviving Family Member Certificate through Nadakacheri, not a '
      + '"legal heir certificate". How to apply, the documents needed, and how it differs from Vamsha Vruksha.',
    h1: 'How do I get a legal heir certificate in Karnataka?',
    answer:
      'Karnataka does not issue a document called a legal heir certificate. The equivalent is the '
      + 'Surviving Family Member Certificate, applied for through the Nadakacheri portal or at an '
      + 'Atalji Janasnehi Kendra, and signed by the Tahsildar. There is a second, different document '
      + 'called Vamsha Vruksha — a family tree certificate — and families routinely apply for the '
      + 'wrong one of the two.',
    documents: [
      'Death certificate of the deceased',
      'Aadhaar of the applicant and of each surviving family member being listed',
      'Address proof of the deceased',
      'A declaration naming every surviving family member',
      'Ration card, where it records the family together',
    ],
    fee: 'Nominal — a government charge in the tens of rupees, with an extra charge if you want it posted',
    timeline: 'Commonly reported at about a week when filed online with complete documents, longer at a counter',
    localDetail: [
      'Surviving Family Member Certificate and Vamsha Vruksha are not interchangeable. The first lists who survived the deceased; the second maps a family tree across generations, and is usually wanted for ancestral property rather than for a bank claim. If an institution has asked you for proof of who the heirs are, the Surviving Family Member Certificate is almost always the one.',
      'Nadakacheri is the Revenue Department\'s own portal and the Atalji Janasnehi Kendra counters are the same system staffed in person. Filing at a counter does not put you in a different queue.',
      'Karnataka is one of the more reliable states for the online route actually working end to end, so it is worth trying before booking time off to queue.',
    ],
    varies:
      'The postal delivery charge is separate from the service fee and is often quoted as a single '
      + 'number online, which makes published figures look inconsistent. Confirm both at the '
      + 'Nadakacheri counter.',
    verifiedOn: '2026-09-15',
  },

  // ------------------------------------------------------------- Maharashtra
  {
    slug: 'maharashtra',
    name: 'Maharashtra',
    certificate: 'Legal Heir Certificate / Warasan Certificate',
    alsoCalled: 'Warasan, or heirship certificate',
    authority: 'Tahsildar, on the Talathi\'s enquiry and report',
    portal: { name: 'Aaple Sarkar', url: 'https://aaplesarkar.mahaonline.gov.in/' },
    title: 'Legal heir certificate in Maharashtra',
    description:
      'How Maharashtra issues a legal heir or Warasan certificate through the Tahsildar and Talathi, '
      + 'why the online route is inconsistent between districts, and what to do about it.',
    h1: 'How do I get a legal heir certificate in Maharashtra?',
    answer:
      'The reliable route in Maharashtra is the Tahsildar\'s office, on an enquiry and report by the '
      + 'Talathi for the village or ward where the deceased lived. Aaple Sarkar is the state\'s citizen '
      + 'services portal and lists Revenue Department services, but whether this particular certificate '
      + 'is available online varies by district — which is why published guidance on it contradicts '
      + 'itself. Treat the online portal as worth checking first and the Tahsildar\'s office as the '
      + 'route that actually works.',
    documents: [
      'Death certificate issued by the municipal corporation or gram panchayat',
      'Identity and address proof of every heir being named',
      'A notarised self-declaration affidavit on stamp paper listing all heirs',
      'Address proof of the deceased, establishing the taluka or ward',
      'The application form, with a court fee stamp affixed where the office requires one',
    ],
    fee: 'Nominal — a court fee stamp on the application, plus the cost of the notarised affidavit',
    timeline: 'Commonly reported at 15 to 30 days, driven by the Talathi enquiry',
    localDetail: [
      'Do not assume the online service exists in your district. Sources disagree on whether the legal heir certificate is offered through Aaple Sarkar at all, and the honest reading is that availability is uneven. Check the portal, and if the service is not listed for your taluka, that is not an error on your part — go to the Tahsildar.',
      'The Talathi\'s report is the step that decides the timeline. The Talathi verifies locally who survived the deceased, and an affidavit that already names every heir consistently with their identity documents is what makes that quick.',
      'Maharashtra families claiming movable assets in Mumbai should ask the institution specifically what it will accept before starting anything — practice in the city differs from the rest of the state, and the answer determines whether a revenue certificate is enough.',
    ],
    varies:
      'Availability of the online service genuinely differs between districts, and so does whether a '
      + 'court fee stamp is required on the form. Confirm with the Tahsildar\'s office for the taluka '
      + 'where the deceased lived, not a neighbouring one.',
    verifiedOn: '2026-09-15',
  },

  // ------------------------------------------------------------------- Delhi
  {
    slug: 'delhi',
    name: 'Delhi',
    certificate: 'Surviving Member Certificate',
    alsoCalled: 'SMC',
    authority: 'Sub-Divisional Magistrate (SDM), Revenue Department',
    portal: { name: 'e-District Delhi', url: 'https://edistrict.delhigovt.nic.in/' },
    title: 'Delhi legal heir certificate: Surviving Member',
    description:
      'Delhi issues a Surviving Member Certificate through the SDM, not a legal heir certificate. '
      + 'How to apply on e-District, the documents and photographs required, and who can apply.',
    h1: 'How do I get a legal heir certificate in Delhi?',
    answer:
      'Delhi does not issue anything called a legal heir certificate. What families are sent to get is '
      + 'the Surviving Member Certificate, issued by the Sub-Divisional Magistrate through the '
      + 'Revenue Department and applied for on the e-District portal. If an institution has asked you '
      + 'for a legal heir certificate and you live in Delhi, the Surviving Member Certificate is the '
      + 'document to ask for by name — asking for the wrong one is the most common reason a Delhi '
      + 'family is turned away at the counter.',
    documents: [
      'Death certificate of the deceased',
      'Identity proof of the applicant and of every surviving family member',
      'Proof of present and permanent address',
      'A signed self-declaration form',
      'Passport-size colour photographs of the applicant and all surviving family members',
      'A separate list of surviving members where there are more than four',
    ],
    fee: 'Not published as a fixed figure by the Revenue Department — expect the stamp paper and affidavit cost rather than a service fee',
    timeline: 'Not published by the Revenue Department; commonly reported at around two weeks online',
    localDetail: [
      'The naming difference is the whole problem. Banks, insurers and employers across India ask for a "legal heir certificate" using that phrase, and the Delhi Revenue Department does not use it. Take the Surviving Member Certificate and, if an institution objects to the name, ask them to point to where their policy requires a differently-titled document.',
      'Photographs of every surviving member are required, which most state processes do not ask for. Gather them before you start rather than discovering it mid-application.',
      'The applicant must be a resident of Delhi. Where the deceased lived in Delhi but the heirs do not, confirm with the SDM office how they want that handled before filing.',
    ],
    varies:
      'The Revenue Department publishes the documents and the eligibility but does not publish a fee '
      + 'or a service timeline, so any specific figure you find online is someone\'s reported '
      + 'experience rather than an official commitment. Ask the SDM office.',
    verifiedOn: '2026-09-15',
  },

  // ----------------------------------------------------------- Uttar Pradesh
  {
    slug: 'uttar-pradesh',
    name: 'Uttar Pradesh',
    certificate: 'Legal Heir Certificate',
    alsoCalled: 'Uttaradhikar Praman Patra',
    authority: 'Tahsildar, through the Tehsil office',
    portal: { name: 'e-District Uttar Pradesh', url: 'https://edistrict.up.gov.in/' },
    title: 'Legal heir certificate in Uttar Pradesh',
    description:
      'How to apply for an Uttar Pradesh legal heir certificate (Uttaradhikar Praman Patra) on '
      + 'e-District, the documents the Tehsil office asks for, and how it differs from varasat mutation.',
    h1: 'How do I get a legal heir certificate in Uttar Pradesh?',
    answer:
      'Apply on the e-District Uttar Pradesh portal under the Revenue Department, or at the Tehsil '
      + 'office for the area where the deceased lived. It is issued by the Tahsildar. Uttar Pradesh '
      + 'also runs a separate process called varasat, which records succession to agricultural land in '
      + 'the revenue record — that is a mutation, not a certificate, and it does not substitute for '
      + 'the heir certificate a bank or insurer is asking for.',
    documents: [
      'Death certificate of the deceased',
      'Aadhaar and a photograph for each heir being named',
      'Proof of relationship — ration card or birth certificates',
      'A notarised affidavit on stamp paper, signed by all heirs, confirming the complete list',
      'Address proof of the deceased',
    ],
    fee: 'Nominal — stamp paper for the affidavit plus a small application charge that differs by district',
    timeline: 'Commonly reported at about 30 days',
    localDetail: [
      'Varasat and the heir certificate solve different problems. If the asset is agricultural land, varasat mutation in the revenue record is what transfers it. If the asset is a bank balance, a policy or a provident fund, the institution wants the heir certificate. Families sent to the Tehsil for one often come away with the other.',
      'The affidavit has to name every heir and be signed by all of them. An affidavit that omits a sibling is the most common reason an application is returned, and it is also the thing that causes trouble later when that sibling objects.',
      'The application charge is set at district level, so a figure from a neighbouring district is not reliable.',
    ],
    varies:
      'The nominal application fee is fixed district by district rather than by the state, so published '
      + 'figures vary legitimately. Confirm at your own Tehsil office.',
    verifiedOn: '2026-09-15',
  },

  // ------------------------------------------------------------------ Kerala
  {
    slug: 'kerala',
    name: 'Kerala',
    certificate: 'Legal Heir Certificate',
    alsoCalled: 'Legal heirship certificate',
    authority: 'Village Officer, or the Tahsildar at the Taluk office',
    portal: { name: 'e-District Kerala', url: 'https://edistrict.kerala.gov.in/' },
    title: 'Legal heir certificate in Kerala: which office',
    description:
      'Kerala issues the legal heir certificate from the Village Office or the Taluk office depending '
      + 'on where you will use it. How to apply through e-District or an Akshaya centre.',
    h1: 'How do I get a legal heir certificate in Kerala?',
    answer:
      'Apply through the e-District Kerala portal or at an Akshaya centre. Which office issues it '
      + 'depends on where you intend to use it: for a claim inside Kerala it is issued by the Village '
      + 'Office, and for a claim outside the state it is issued by the Taluk office. Getting this '
      + 'wrong means a valid certificate that the institution will not accept, so decide where the '
      + 'claim is going before you apply.',
    documents: [
      'Death certificate of the deceased',
      'Aadhaar of the applicant — the portal validates it before allowing the application',
      'Identity proof for each heir being named',
      'Address proof of the deceased',
      'A declaration listing all surviving heirs',
    ],
    fee: 'Nominal — a small charge online, slightly more at an Akshaya centre, which includes their scanning and printing',
    timeline: 'Commonly reported at 15 to 30 days, following the Village Officer\'s enquiry',
    localDetail: [
      'The village-versus-taluk distinction is the one that catches people. A certificate from the Village Office is meant for use within Kerala. If you are claiming from a bank headquartered elsewhere, an insurer outside the state, or the EPFO, ask for the Taluk office certificate — and say so when you apply, because the two are not interchangeable after the fact.',
      'Aadhaar is mandatory on the portal and is validated before you can proceed, so an applicant without a seeded Aadhaar should plan to use an Akshaya centre.',
      'Akshaya centres charge more than the portal, and the difference is their service charge for scanning and printing rather than a different government fee.',
    ],
    varies:
      'Whether a given institution accepts the Village Office certificate or insists on the Taluk one '
      + 'is the institution\'s call, not the state\'s. Ask the bank or insurer which they want before '
      + 'applying, in writing if they will give it.',
    verifiedOn: '2026-09-15',
  },
] as const;

/**
 * The guide these state pages hang off. Named here rather than hard-coded in the
 * guide template so the relationship is greppable from both ends.
 */
export const STATE_GUIDE_SLUG = 'legal-heir-certificate';

export function stateBySlug(slug: string): StateProcess | undefined {
  return STATES.find((s) => s.slug === slug);
}

/**
 * The questions actually asked about a state's certificate, answered from that
 * state's own record.
 *
 * Both the visible section on the page and the FAQPage structured data are
 * rendered from this one function. That is deliberate and it is not optional:
 * Google requires that marked-up FAQ content be visible on the page, and this
 * repository has already had to remove one block of structured data — a generic
 * HowTo emitted on every guide — because its steps appeared nowhere in the
 * markup. Generating both from a single array is what makes that class of
 * mistake impossible rather than merely unlikely.
 */
export function stateFaqs(s: StateProcess): ReadonlyArray<{ q: string; a: string }> {
  const named = s.certificate.toLowerCase() === 'legal heir certificate';

  return [
    {
      q: `What is a legal heir certificate called in ${s.name}?`,
      a: named
        ? `In ${s.name} it is issued as a ${s.certificate}${s.alsoCalled ? `, also known as a ${s.alsoCalled}` : ''}. `
          + `It is signed by the ${s.authority}.`
        : `${s.name} does not issue a document called a legal heir certificate. The equivalent is the `
          + `${s.certificate}${s.alsoCalled ? ` (${s.alsoCalled})` : ''}, issued by the ${s.authority}. `
          + `Ask for it by that name — asking for a legal heir certificate is why families are turned away at the counter.`,
    },
    {
      q: `Who issues the ${s.certificate.toLowerCase()} in ${s.name}?`,
      a: `The ${s.authority}. Applications are made through ${s.portal.name}`
        + `${s.serviceCode ? `, where the service is listed as ${s.serviceCode}` : ''}, `
        + `or in person at the relevant office.`,
    },
    {
      q: `How long does a legal heir certificate take in ${s.name}, and what does it cost?`,
      a: `${s.timeline}. ${s.fee}. Both are reported figures rather than a published guarantee. ${s.varies}`,
    },
    {
      q: `Will a ${s.name} ${s.certificate.toLowerCase()} be enough to claim a bank account?`,
      a: 'Often, yes — below the threshold the bank has fixed, a heir certificate with an indemnity bond '
        + 'and no-objection letters from the other heirs is usually accepted, and no court order is needed. '
        + 'Above that threshold the bank can insist on a succession certificate from a civil court. '
        + 'Ask the branch in writing which applies to your case before starting anything.',
    },
  ];
}
