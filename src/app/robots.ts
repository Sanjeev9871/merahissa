import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      // Anything behind sign-in, plus the API. None of it is useful in a
      // search result and some of it is a family's case.
      disallow: ['/api/', '/cases/', '/admin/', '/intake/', '/signin', '/auth/'],
    }],
    sitemap: `${SITE.url}/sitemap.xml`,
    // The Host directive takes a bare hostname, not a scheme-qualified URL.
    host: new URL(SITE.url).host,
  };
}
