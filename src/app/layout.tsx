import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { SITE, organizationJsonLd, websiteJsonLd, JsonLd } from '@/lib/seo';
import { UI, HTML_LANG, localeFromPath, localePath, pathForLocale } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    // Every page gets the brand appended without repeating it in each file.
    default: 'Mera Hissa — claim a family member\'s accounts, shares and insurance',
    template: '%s · Mera Hissa',
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    'succession certificate', 'legal heir certificate', 'claim bank account after death',
    'transmission of shares', 'IEPF claim', 'nominee vs legal heir',
    'Hindu Succession Act shares', 'death claim documents India',
    'उत्तराधिकार प्रमाण पत्र', 'विधिक वारिस प्रमाण पत्र', 'मृत्यु के बाद बैंक खाता दावा',
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: 'website', locale: SITE.locale, siteName: SITE.name,
    url: SITE.url, title: SITE.tagline, description: SITE.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, email: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Match the real page ground (--ground) so the mobile browser chrome does not
  // show a faint seam against the page.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#faf8f5' },
    { media: '(prefers-color-scheme: dark)', color: '#16150f' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Middleware puts the path here; a layout cannot otherwise see it.
  const pathname = (await headers()).get('x-pathname') ?? '/';
  const locale = localeFromPath(pathname);
  const t = UI[locale];
  const L = (path: string) => localePath(locale, path);

  return (
    <html lang={HTML_LANG[locale]}>
      <head>
        {/* Tells Google these are the same page in two languages rather than
            duplicates, and which to serve to whom. */}
        <link rel="alternate" hrefLang="en-IN" href={`${SITE.url}${pathForLocale(pathname, 'en')}`} />
        <link rel="alternate" hrefLang="hi-IN" href={`${SITE.url}${pathForLocale(pathname, 'hi')}`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE.url}${pathForLocale(pathname, 'en')}`} />
      </head>
      <body>
        {/* Site-wide structured data. Page-level schema is added per page. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

        <a href="#main" className="skip">{t.skipToContent}</a>

        <div className="shell">
          <header className="masthead">
            <Link href={L('/')} className="wordmark-link">
              <span className="wordmark">Mera Hissa<span className="dot">.</span></span>
            </Link>
            <nav className="nav-links" aria-label={locale === 'hi' ? 'मुख्य' : 'Main'}>
              <Link href={L('/guides')}>{t.nav.guides}</Link>
              <Link href={L('/faq')}>{t.nav.questions}</Link>
              <Link href={L('/contact')}>{t.nav.contact}</Link>
              <LanguageSwitcher locale={locale} pathname={pathname} />
            </nav>
          </header>

          <main id="main">{children}</main>

          {/* Load-bearing, not boilerplate: this wording is what keeps the
              service lawful for a non-advocate operator. It appears on every
              page and inside every generated pack. */}
          <footer className="site-footer">
            {/* Owns the footer's column headings so a heading-only page (e.g.
                /signin) does not skip from its h1 straight to the footer h3s. */}
            <h2 className="visually-hidden">{t.footer.aboutHeading}</h2>
            <div className="foot-cols">
              <div>
                <h3>Mera Hissa</h3>
                <p>{t.footer.blurb}</p>
              </div>
              <div>
                <h3>{t.footer.readFirst}</h3>
                <ul>
                  <li><Link href={L('/guides/claim-bank-account-after-death')}>
                    {locale === 'hi' ? 'बैंक खाते पर दावा' : 'Claiming a bank account'}
                  </Link></li>
                  <li><Link href={L('/guides/succession-certificate-india')}>
                    {locale === 'hi' ? 'उत्तराधिकार प्रमाण पत्र' : 'Succession certificates'}
                  </Link></li>
                  <li><Link href={L('/guides/nominee-vs-legal-heir')}>
                    {locale === 'hi' ? 'नॉमिनी बनाम कानूनी वारिस' : 'Nominee vs legal heir'}
                  </Link></li>
                  <li><Link href={L('/faq')}>{t.footer.allQuestions}</Link></li>
                </ul>
              </div>
              <div>
                <h3>{t.footer.reachUs}</h3>
                <ul>
                  <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
                  <li><a href={`tel:${SITE.phoneHref}`}>{SITE.phone}</a></li>
                  <li><Link href={L('/contact')}>{t.footer.askQuestion}</Link></li>
                  <li><Link href={L('/privacy')}>{t.footer.privacy}</Link></li>
                  <li><Link href={L('/terms')}>{t.footer.terms}</Link></li>
                  <li><Link href={L('/refund')}>{t.footer.refund}</Link></li>
                </ul>
              </div>
            </div>

            <p className="disclaimer">{t.footer.disclaimer}</p>
            <p className="disclaimer">{t.footer.dataNote}</p>
          </footer>
        </div>

        {/* Cookieless, aggregate page-view counting only. Sets no cookies, stores
            no IP, and identifies no individual. Note that PostHog (loaded via
            instrumentation-client.ts) is a separate, cookie-setting product
            analytics tool — both are disclosed in the privacy notice. */}
        <Analytics />
      </body>
    </html>
  );
}
