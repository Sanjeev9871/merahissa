/**
 * Site constants.
 *
 * Kept in a plain .ts file, separate from seo.tsx, so anything that is not a
 * React component can import them — including the test suite, which runs on
 * Node's type stripping and cannot parse JSX.
 */
export const SITE = {
  name: 'Mera Hissa',
  // Set NEXT_PUBLIC_SITE_URL in production; every canonical URL derives from it.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://merahissa.in',
  tagline: 'Estate claim paperwork for Indian families',
  description:
    'Find out exactly which documents each bank, fund and insurer needs to release '
    + 'a family member\'s money, and what the law says each heir inherits. '
    + 'Free check, no account needed.',
  locale: 'en_IN',
  email: 'hello@merahissa.in',
  phone: '+91-00000-00000',
} as const;
