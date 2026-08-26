import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { FAQS } from './faq';
import { SITE } from './site';

/**
 * SEO.
 *
 * The search intent here is unusually specific and unusually motivated. People
 * type "how to claim father's bank account after death", "succession
 * certificate procedure", "IEPF form 5 claim process" — long, worried,
 * question-shaped queries. They are not browsing; they need an answer today.
 *
 * So the strategy is not keyword stuffing. It is:
 *   1. Answer the actual question completely, for free, on a page anyone can
 *      read without signing up. Google rewards that and so do people.
 *   2. Mark it up so Google can lift the answer into a rich result — FAQPage,
 *      HowTo, Organization, BreadcrumbList.
 *   3. One page per real question, at a URL that reads like the question.
 *
 * Google's own guidance is that content written for people outranks content
 * written for crawlers. The free check IS the SEO strategy — it is the thing
 * worth linking to.
 */

export { SITE } from './site';

/** Per-page metadata with sensible inheritance from the site defaults. */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string;
  /** Set false for pages that should not be indexed (app screens). */
  index?: boolean;
}): Metadata {
  const url = `${SITE.url}${opts.path}`;

  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.index === false
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          'max-snippet': -1,
          'max-image-preview': 'large',
        },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
  };
}

// ---------------------------------------------------------------------------
// Structured data
//
// Rendered as <script type="application/ld+json">. Everything below is derived
// from the same content the page shows — never a separate copy that can drift,
// which is both a maintenance win and what Google's guidelines require.
// ---------------------------------------------------------------------------

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE.url}/#organization`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    areaServed: { '@type': 'Country', name: 'India' },
    serviceType: 'Estate transmission document preparation',
    knowsLanguage: ['en-IN', 'hi-IN'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SITE.email,
      availableLanguage: ['English', 'Hindi'],
    },
    // Stated plainly in the markup as well as on the page.
    disambiguatingDescription:
      'Mera Hissa prepares estate claim documents. It is not a law firm and does not '
      + 'provide legal advice or represent clients before courts or tribunals.',
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: 'en-IN',
    publisher: { '@id': `${SITE.url}/#organization` },
  };
}

/** Built from FAQS so the rich result and the page can never disagree. */
export function faqJsonLd(subset = FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: subset.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function howToJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to claim a deceased family member\'s bank accounts and investments in India',
    description:
      'The steps to transfer a deceased person\'s bank accounts, shares, mutual funds, '
      + 'insurance and provident fund to their legal heirs.',
    totalTime: 'P60D',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Obtain the death certificate',
        text: 'Register the death and collect certified copies from the municipal corporation. Every institution needs one.',
      },
      {
        '@type': 'HowToStep',
        name: 'Establish who the legal heirs are',
        text: 'Determine the shares under the succession law that applies to your community, and obtain a legal heir certificate where required.',
      },
      {
        '@type': 'HowToStep',
        name: 'List every holding',
        text: 'Collect details of each bank account, demat holding, mutual fund folio, insurance policy and provident fund account.',
      },
      {
        '@type': 'HowToStep',
        name: 'Prepare the documents each institution requires',
        text: 'Claim forms, affidavits of heirship, indemnity bonds on stamp paper, and no-objection letters from other heirs. Requirements differ by institution and by amount.',
      },
      {
        '@type': 'HowToStep',
        name: 'File and follow up',
        text: 'Submit to each institution in parallel and track queries. Anything requiring a succession certificate must go through a civil court first.',
      },
    ],
  };
}

export function breadcrumbJsonLd(
  trail: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${SITE.url}${t.path}`,
    })),
  };
}

/**
 * Renders JSON-LD. Content comes from our own functions above, never from user
 * input, so there is nothing to escape — but keep it that way.
 *
 * The CSP nonce is generated once per request by middleware. React does not
 * know that request-specific nonce during client hydration, so the nonce
 * attribute is deliberately excluded from hydration reconciliation.
 */
export async function JsonLd({
  data,
}: {
  data: object | object[];
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}