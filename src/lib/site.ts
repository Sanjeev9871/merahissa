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
  // Kept under ~155 characters so Google does not truncate it in results.
  description:
    'Find out which documents each bank, fund and insurer needs to release a family '
    + 'member\'s money, and what each heir inherits. Free check, no account needed.',
  locale: 'en_IN',
  email: 'hello@merahissa.in',
  phone: '+91 98101 91376',
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
