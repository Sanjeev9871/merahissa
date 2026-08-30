import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { FAQS } from './faq.ts';
import { SITE } from './site.ts';

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

export { SITE } from './site.ts';

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
    telephone: SITE.phoneHref,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${SITE.address.street}, ${SITE.address.locality}`,
      addressLocality: SITE.address.region,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.countryCode,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SITE.email,
      telephone: SITE.phoneHref,
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