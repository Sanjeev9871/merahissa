/**
 * Bilingual support: English and Hindi.
 *
 * Most families dealing with a death in India are more comfortable in Hindi
 * than in English, and the language someone reads a death-claim guide in is
 * not a preference — it is whether they understand their own entitlement.
 *
 * URL SHAPE: English stays at the existing paths (`/guides/x`) and Hindi lives
 * under a `/hi` prefix (`/hi/guides/x`). English keeps its URLs because they
 * are the ones already canonicalised and submitted to Google; adding a prefix
 * to them would throw that away. Each page declares hreflang alternates in
 * both directions so Google serves the right language and does not read the
 * two as duplicates.
 *
 * The locale is derived from the request path in middleware (which sets
 * `x-pathname`) and read once in the root layout, so page components do not
 * each have to thread it through.
 */

export const LOCALES = ['en', 'hi'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Locale implied by a pathname. `/hi`, `/hi/...` are Hindi; everything else English. */
export function localeFromPath(pathname: string): Locale {
  return pathname === '/hi' || pathname.startsWith('/hi/') ? 'hi' : 'en';
}

/** The same page's path in the other language, for the switcher and hreflang. */
export function pathForLocale(pathname: string, locale: Locale): string {
  const bare = pathname === '/hi' ? '/' : pathname.replace(/^\/hi(?=\/)/, '');
  const normalised = bare === '' ? '/' : bare;
  if (locale === 'en') return normalised;
  return normalised === '/' ? '/hi' : `/hi${normalised}`;
}

/** Build an href in the given locale from a language-neutral path. */
export function localePath(locale: Locale, path: string): string {
  if (locale === 'en') return path;
  return path === '/' ? '/hi' : `/hi${path}`;
}

/** BCP-47 tags used for `lang` and hreflang. */
export const HTML_LANG: Record<Locale, string> = { en: 'en-IN', hi: 'hi-IN' };

// ---------------------------------------------------------------------------
// UI strings
//
// Chrome and shared copy only. Long-form page content lives with the content
// it belongs to (guides.hi.ts, faq.ts), not here.
// ---------------------------------------------------------------------------

interface UiStrings {
  tagline: string;
  nav: { guides: string; questions: string; contact: string; examples: string };
  skipToContent: string;
  languageName: string;
  switchTo: string;
  switchToLabel: string;
  footer: {
    aboutHeading: string;
    blurb: string;
    readFirst: string;
    allQuestions: string;
    reachUs: string;
    askQuestion: string;
    privacy: string;
    terms: string;
    refund: string;
    disclaimer: string;
    dataNote: string;
  };
  cta: { check: string; checkNote: string; startCase: string };
  notFound: { title: string; body: string; startFrom: string; home: string };
  guideMeta: { lastReviewed: string; related: string; notLegalAdvice: string };
  fallbackNotice: string;
}

export const UI: Record<Locale, UiStrings> = {
  en: {
    tagline: 'Estate claim paperwork for Indian families',
    nav: { guides: 'Guides', questions: 'Questions', contact: 'Contact', examples: 'Examples' },
    skipToContent: 'Skip to content',
    languageName: 'English',
    switchTo: 'हिन्दी',
    switchToLabel: 'हिन्दी में पढ़ें',
    footer: {
      aboutHeading: 'About Mera Hissa',
      blurb:
        'We prepare the paperwork for transferring a deceased family member’s bank '
        + 'accounts, shares, mutual funds, insurance and provident fund to their legal heirs.',
      readFirst: 'Read first',
      allQuestions: 'All questions',
      reachUs: 'Reach us',
      askQuestion: 'Ask us a question',
      privacy: 'Privacy',
      terms: 'Terms',
      refund: 'Refund & cancellation',
      disclaimer:
        'Mera Hissa prepares documents and explains the steps involved in claiming assets '
        + 'left by a family member. We are not a law firm and this is not legal advice. '
        + 'We do not represent anyone before a court or tribunal. Where a case needs a '
        + 'succession certificate, probate, or letters of administration, we refer you to an advocate.',
      dataNote:
        'Your documents are stored encrypted, are never used to train any AI system, and are '
        + 'deleted 90 days after your case closes. You can ask us to delete everything at any time.',
    },
    cta: {
      check: 'Find out what my case needs',
      checkNote: 'Free · no account · about two minutes',
      startCase: 'Start a case',
    },
    notFound: {
      title: 'We could not find that page',
      body:
        'The link may be old, or the address may have a typo. Nothing is lost — here is '
        + 'where most people are heading.',
      startFrom: 'Or start from one of these',
      home: 'Home',
    },
    guideMeta: {
      lastReviewed: 'Last reviewed',
      related: 'Related',
      notLegalAdvice:
        'This is general information, not legal advice. Institution requirements change — '
        + 'confirm before you file.',
    },
    fallbackNotice: '',
  },

  hi: {
    tagline: 'भारतीय परिवारों के लिए उत्तराधिकार दावे के कागज़ात',
    nav: { guides: 'मार्गदर्शिकाएँ', questions: 'सवाल-जवाब', contact: 'संपर्क', examples: 'उदाहरण' },
    skipToContent: 'मुख्य सामग्री पर जाएँ',
    languageName: 'हिन्दी',
    switchTo: 'English',
    switchToLabel: 'Read in English',
    footer: {
      aboutHeading: 'मेरा हिस्सा के बारे में',
      blurb:
        'किसी परिवारजन के निधन के बाद उनके बैंक खाते, शेयर, म्यूचुअल फंड, बीमा और भविष्य निधि '
        + 'को उनके कानूनी वारिसों के नाम कराने के कागज़ात हम तैयार करते हैं।',
      readFirst: 'पहले यह पढ़ें',
      allQuestions: 'सभी सवाल',
      reachUs: 'हमसे संपर्क करें',
      askQuestion: 'हमसे सवाल पूछें',
      privacy: 'निजता नीति',
      terms: 'नियम व शर्तें',
      refund: 'रिफंड और रद्दीकरण',
      disclaimer:
        'मेरा हिस्सा कागज़ात तैयार करता है और परिवारजन की संपत्ति पर दावा करने की प्रक्रिया समझाता है। '
        + 'हम कोई लॉ फर्म नहीं हैं और यह कानूनी सलाह नहीं है। हम किसी अदालत या न्यायाधिकरण में आपका '
        + 'प्रतिनिधित्व नहीं करते। जहाँ मामले में उत्तराधिकार प्रमाण पत्र, प्रोबेट या प्रशासन पत्र की '
        + 'ज़रूरत हो, वहाँ हम आपको वकील के पास भेजते हैं।',
      dataNote:
        'आपके दस्तावेज़ एन्क्रिप्टेड रूप में रखे जाते हैं, किसी भी AI सिस्टम को प्रशिक्षित करने के लिए '
        + 'कभी इस्तेमाल नहीं होते, और आपका मामला बंद होने के 90 दिन बाद मिटा दिए जाते हैं। आप कभी भी '
        + 'हमसे सब कुछ मिटाने के लिए कह सकते हैं।',
    },
    cta: {
      check: 'जानिए आपके मामले में क्या चाहिए',
      checkNote: 'निःशुल्क · खाता बनाने की ज़रूरत नहीं · लगभग दो मिनट',
      startCase: 'मामला शुरू करें',
    },
    notFound: {
      title: 'यह पृष्ठ नहीं मिला',
      body:
        'हो सकता है लिंक पुराना हो, या पते में कोई गलती हो। कुछ खोया नहीं है — ज़्यादातर लोग '
        + 'यहाँ से आगे बढ़ते हैं।',
      startFrom: 'या इनमें से किसी एक से शुरू करें',
      home: 'मुख्य पृष्ठ',
    },
    guideMeta: {
      lastReviewed: 'अंतिम समीक्षा',
      related: 'संबंधित',
      notLegalAdvice:
        'यह सामान्य जानकारी है, कानूनी सलाह नहीं। संस्थानों की ज़रूरतें बदलती रहती हैं — दाखिल करने '
        + 'से पहले पुष्टि कर लें।',
    },
    fallbackNotice:
      'इस मार्गदर्शिका का हिन्दी अनुवाद अभी तैयार हो रहा है। नीचे अंग्रेज़ी में पूरी जानकारी दी गई है।',
  },
};
