import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';
import { isProductionDeploy } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  // Staging serves the same pages as production. If it were crawlable, Google
  // would be offered two copies of every guide and would pick a winner itself —
  // and the site has already lost its indexing once. Nothing outside production
  // is crawlable, and the sitemap is withheld too so there is no invitation.
  if (!isProductionDeploy()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
      host: new URL(SITE.url).host,
    };
  }

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
