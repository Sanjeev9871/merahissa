import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';
import { GUIDES } from '@/lib/guides';

/**
 * Sitemap. Only pages worth indexing appear here — the app screens (intake,
 * cases, admin) are noindex and deliberately absent, because a search result
 * pointing at a sign-in wall is a wasted click for everyone.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE.url}/triage`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    // The guides index: indexable, in the main nav, and the hub linking every
    // guide — it was the one public indexable page missing from the sitemap.
    { url: `${SITE.url}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE.url}/examples`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE.url}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...GUIDES.map((g) => ({
      url: `${SITE.url}/guides/${g.slug}`,
      lastModified: new Date(g.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),

    // Hindi. Listed so the translated pages are discovered directly rather than
    // only through the hreflang alternates on their English counterparts.
    { url: `${SITE.url}/hi`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE.url}/hi/triage`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE.url}/hi/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE.url}/hi/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE.url}/hi/examples`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE.url}/hi/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE.url}/hi/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/hi/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE.url}/hi/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    ...GUIDES.map((g) => ({
      url: `${SITE.url}/hi/guides/${g.slug}`,
      lastModified: new Date(g.updated),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
