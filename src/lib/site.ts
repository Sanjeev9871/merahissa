/**
 * Site constants and deployment environment.
 *
 * Kept in a plain .ts file, separate from seo.tsx, so anything that is not a
 * React component can import them — including the test suite, which runs on
 * Node's type stripping and cannot parse JSX.
 */

/**
 * The one host that is the real, public Mera Hissa. Everything else — staging,
 * a Vercel preview URL, localhost — is by definition not production, and the
 * checks below hang off that single fact.
 *
 * merahissa.in 308-redirects to www.merahissa.in, so the www form is canonical.
 */
export const PRODUCTION_HOST = 'www.merahissa.in';

/** The staging host, which runs the same code against Razorpay test mode. */
export const STAGING_HOST = 'stage.merahissa.in';

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
 *
 * The second defence is for staging. A preview deployment must never fall back
 * to the production origin: if it did, staging would publish canonicals
 * pointing at www (inviting Google to treat a test site as the real one), and
 * — worse — it would look like production to deployEnv() below, which decides
 * whether real cards may be charged.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '');
  const vercelEnv = process.env.VERCEL_ENV?.trim();
  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  // This particular deployment's own generated hostname.
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const isLocalhost =
    !!explicit && /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(explicit);

  if (explicit && !(isLocalhost && vercelProd)) return explicit;
  // A preview build with no explicit origin describes itself, never production.
  if (vercelEnv === 'preview' && vercelUrl) return `https://${vercelUrl}`;
  if (vercelProd) return `https://${vercelProd}`;
  return `https://${PRODUCTION_HOST}`;
}

export const SITE = {
  name: 'Mera Hissa',
  // Prefer NEXT_PUBLIC_SITE_URL (a real custom domain, set per environment in
  // Vercel); falls back as described above.
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

// ---------------------------------------------------------------------------
// Deployment environment
// ---------------------------------------------------------------------------

export type DeployEnv = 'production' | 'staging' | 'development';

/**
 * Which deployment this is.
 *
 * Two things hang off the answer, and both are things you only get one chance
 * to get right: whether search engines may index the site, and whether
 * Razorpay runs in live mode against real cards.
 *
 * The origin's host is the primary signal rather than VERCEL_ENV, because
 * VERCEL_ENV is not decisive on its own — if staging is ever split into its
 * own Vercel project, its deployments report VERCEL_ENV="production" too. The
 * host cannot lie in the same way: only the deployment actually serving
 * www.merahissa.in claims to be production.
 *
 * NEXT_PUBLIC_DEPLOY_ENV overrides everything, and is the escape hatch for a
 * local build that needs to imitate one of the deployed environments. It is
 * NEXT_PUBLIC_ so that client and server agree; every other signal here is
 * server-only and reads as undefined in a browser bundle.
 */
export function deployEnv(): DeployEnv {
  const explicit = process.env.NEXT_PUBLIC_DEPLOY_ENV?.trim().toLowerCase();
  if (explicit === 'production' || explicit === 'staging' || explicit === 'development') {
    return explicit;
  }

  let host = '';
  try {
    host = new URL(SITE.url).host.toLowerCase();
  } catch {
    // An unparseable origin is a misconfiguration; treat it as not-production
    // so the strict path is the one taken.
    return 'development';
  }

  // Production needs BOTH conditions. The host alone is not enough, because
  // resolveSiteUrl() falls back to the production host when nothing is
  // configured at all — which is exactly the state a developer's laptop is in,
  // and calling that machine "production" would authorise live keys on it.
  if (host === PRODUCTION_HOST && process.env.VERCEL) return 'production';
  // Anything else served by Vercel is a staging or preview deployment.
  if (process.env.VERCEL) return 'staging';
  return 'development';
}

/**
 * True only for the real public site. Deliberately phrased as a positive check
 * against one host, so that every failure mode — a missing env var, a typo, a
 * preview URL — lands on `false` and gets the cautious behaviour.
 */
export function isProductionDeploy(): boolean {
  return deployEnv() === 'production';
}
