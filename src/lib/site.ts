/**
 * Site constants.
 *
 * Kept in a plain .ts file, separate from seo.tsx, so anything that is not a
 * React component can import them — including the test suite, which runs on
 * Node's type stripping and cannot parse JSX.
 */
/**
 * The site's public origin. Every canonical URL, og:url, sitemap <loc> and
 * robots directive derives from this, so a wrong value here silently
 * de-indexes the whole site.
 *
 * It is resolved defensively because that is exactly what went wrong once:
 * NEXT_PUBLIC_SITE_URL was set to http://localhost:3000 in production, which
 * pointed every canonical at an unreachable localhost URL and hid the site
 * from search. So a localhost value is ignored WHEN WE ARE ON VERCEL (where
 * the real production domain is exposed as VERCEL_PROJECT_PRODUCTION_URL),
 * while a localhost value is kept for genuine local development.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const isLocalhost =
    !!explicit && /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(explicit);

  if (explicit && !(isLocalhost && vercelProd)) return explicit;
  if (vercelProd) return `https://${vercelProd}`;
  // The confirmed canonical host: merahissa.in 308-redirects to www.merahissa.in.
  return 'https://www.merahissa.in';
}

export const SITE = {
  name: 'Mera Hissa',
  // Prefer NEXT_PUBLIC_SITE_URL (a real custom domain in production); falls back
  // to the Vercel production domain, then to the brand domain. See above.
  url: resolveSiteUrl(),
  tagline: 'Estate claim paperwork for Indian families',
  // Kept under ~155 characters so Google does not truncate it in results.
  description:
    'Find out which documents each bank, fund and insurer needs to release a family '
    + 'member\'s money, and what each heir inherits. Free check, no account needed.',
  locale: 'en_IN',
  email: 'info@merahissa.in',
  phone: '+91-98101-91376',
  // Tel-safe form (no spaces) for the href, so the display string can stay
  // human-readable.
  phoneHref: '+919810191376',
  address: {
    street: 'J010, Tower B, Ground Floor',
    locality: 'Jasola',
    region: 'New Delhi',
    postalCode: '110065',
    country: 'India',
    countryCode: 'IN',
  },
} as const;
