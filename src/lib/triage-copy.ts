/**
 * Triage wizard copy, in both languages.
 *
 * Kept out of the component so the wizard's logic exists once and only the
 * words change between English and Hindi. The share computation and document
 * rules are shared code, so the free check can never give two different
 * answers in two languages.
 */

export type TriageLocale = 'en' | 'hi';

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

export const TRIAGE_COPY: Record<TriageLocale, TriageCopy> = {
  en: {
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
  },

  hi: {
    title: 'आपके मामले में क्या चाहिए?',
    intro:
      'छह सवाल। यहाँ आप जो भी भरेंगे वह आपके उपकरण से बाहर नहीं जाता। यह पृष्ठ हमें कुछ नहीं '
      + 'भेजता, और हम नाम कभी नहीं पूछते।',
    progress: 'प्रगति',
    stepOf: (n, of) => `चरण ${n} / ${of}`,
    q0: 'किस समुदाय का उत्तराधिकार कानून लागू होता है?',
    q0hint:
      'भारत में यह उस व्यक्ति के समुदाय से तय होता है जिनका निधन हुआ है, जब तक कोई वैध वसीयत न हो।',
    wasFemale: 'यह एक महिला थीं',
    wasFemaleHint:
      'हिंदू उत्तराधिकार अधिनियम महिलाओं के लिए अलग नियम रखता है, इसलिए इससे जवाब बदल जाता है।',
    q1: 'परिवार में कौन-कौन है?',
    q1hint: 'हर जीवित नज़दीकी रिश्तेदार जोड़िए। यहाँ नाम नहीं — सिर्फ़ रिश्ता।',
    relative: (i) => `रिश्तेदार ${i}`,
    remove: 'हटाएँ',
    addRelative: 'एक और रिश्तेदार जोड़ें',
    q2: 'उनके पास क्या-क्या था?',
    q2hint: 'जो भी लागू हो, सब चुनिए।',
    q3: 'क्या कोई नॉमिनी दर्ज था?',
    q3hint:
      'दर्ज नॉमिनी होने पर बैंक और फंड के दावे काफ़ी आसान हो जाते हैं। पक्का पता न हो तो वही '
      + 'चुनिए — हम मान लेंगे कि नहीं था।',
    nomYes: 'हाँ, ज़्यादातर खातों में',
    nomNo: 'नहीं',
    nomUnsure: 'पक्का पता नहीं',
    back: 'पीछे',
    cont: 'आगे',
    sumTitle: 'आपके मामले में यह शामिल है',
    advocateTitle: 'आपके मामले में सिर्फ़ कागज़ात नहीं, वकील चाहिए।',
    advocateBody:
      'हम पहले पैसे लेने की बजाय अभी बताना बेहतर समझते हैं। हम आपको ऐसे वकील से मिलवा सकते हैं '
      + 'जो ये मामले देखता हो।',
    sharesLabel: 'आप पर लागू कानून के अनुसार हिस्से:',
    docsLabel: 'आपको ये दस्तावेज़ चाहिए होंगे:',
    courtTitle: 'कम से कम एक संपत्ति के लिए उत्तराधिकार प्रमाण पत्र चाहिए होगा।',
    courtBody:
      'यह भारतीय उत्तराधिकार अधिनियम के तहत अदालती आवेदन है और आम तौर पर छह महीने या उससे ज़्यादा '
      + 'लेता है। उसके आसपास का सब कुछ हम तैयार करते हैं, पर दाखिल वकील को करना होगा।',
    unsupported:
      'आपने जो बताया उसमें कुछ (PPF, NPS या लॉकर) हम स्वचालित रूप से नहीं, हाथ से सँभालते हैं। '
      + 'उनके चरण हम आपसे सीधे तय करेंगे।',
    nothingSent: 'यहाँ का कुछ भी हमें नहीं भेजा गया है।',
    nothingSentBody:
      'यह पृष्ठ पूरी तरह आपके ब्राउज़र में चला। अगर आप चाहें कि हम ये दस्तावेज़ तैयार करें, तो '
      + 'अगला चरण एक खाता बनाता है और वही विवरण माँगता है जो वाकई चाहिए।',
    prepare: 'मेरे लिए ये दस्तावेज़ तैयार कीजिए',
    intakeHref: '/intake',
  },
};

/** Relationship labels shown in the wizard's dropdowns. */
export const REL_LABELS_BY_LOCALE: Record<TriageLocale, Record<string, string>> = {
  en: {
    spouse: 'Wife or husband', son: 'Son', daughter: 'Daughter',
    mother: 'Mother', father: 'Father', brother: 'Brother', sister: 'Sister',
    grandson: 'Grandson', granddaughter: 'Granddaughter', other: 'Someone else',
  },
  hi: {
    spouse: 'पत्नी या पति', son: 'बेटा', daughter: 'बेटी',
    mother: 'माँ', father: 'पिता', brother: 'भाई', sister: 'बहन',
    grandson: 'पोता/नाती', granddaughter: 'पोती/नातिन', other: 'कोई और',
  },
};

export const REGIME_LABELS_BY_LOCALE: Record<TriageLocale, Record<string, string>> = {
  en: {
    hindu: 'Hindu, Sikh, Jain or Buddhist',
    muslim_sunni: 'Muslim (Sunni)', muslim_shia: 'Muslim (Shia)',
    christian: 'Christian', parsi: 'Parsi',
    testate: 'There is a will', unknown: 'Not sure',
  },
  hi: {
    hindu: 'हिंदू, सिख, जैन या बौद्ध',
    muslim_sunni: 'मुस्लिम (सुन्नी)', muslim_shia: 'मुस्लिम (शिया)',
    christian: 'ईसाई', parsi: 'पारसी',
    testate: 'वसीयत मौजूद है', unknown: 'पक्का पता नहीं',
  },
};

export const ASSET_LABELS_BY_LOCALE: Record<TriageLocale, Record<string, string>> = {
  en: {
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
  },
  hi: {
    bank_deposit: 'बैंक खाता या सावधि जमा (FD)',
    demat_shares: 'डीमैट खाते के शेयर',
    iepf_shares: 'IEPF में गए पुराने शेयर',
    mutual_fund: 'म्यूचुअल फंड',
    insurance_policy: 'जीवन बीमा पॉलिसी',
    epf: 'भविष्य निधि (EPF)',
    ppf: 'PPF खाता',
    nps: 'राष्ट्रीय पेंशन प्रणाली (NPS)',
    post_office: 'डाकघर बचत',
    safe_deposit: 'बैंक लॉकर',
    other: 'कुछ और',
  },
};
