import type { Metadata } from 'next';
import Link from 'next/link';
import { Instrument_Serif, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { SITE, organizationJsonLd, websiteJsonLd, JsonLd } from '@/lib/seo';
import { isProductionDeploy } from '@/lib/site';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const dynamic = 'force-dynamic';

/**
 * Typography.
 *
 * next/font downloads these at build time and serves them from our own origin,
 * which is the only reason they are usable at all: the CSP is `font-src 'self'`
 * and a runtime request to a font CDN would be blocked. Both declare a system
 * fallback in globals.css, so a build without network degrades to Palatino /
 * Helvetica rather than to nothing.
 */
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});

const text = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-text',
});

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
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: 'website', locale: SITE.locale, siteName: SITE.name,
    url: SITE.url, title: SITE.tagline, description: SITE.description,
  },
  // robots.txt asks crawlers not to fetch staging; this tag is what stops a
  // staging page that someone linked to from being indexed anyway. Both are
  // needed, because a disallowed URL can still appear in results on the
  // strength of inbound links alone.
  robots: isProductionDeploy()
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  formatDetection: { telephone: true, email: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Match the real page ground (--ground) so the mobile browser chrome does not
  // show a faint seam against the page.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1e8' },
    { media: '(prefers-color-scheme: dark)', color: '#14130e' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${text.variable}`}>
      <body>
        <GoogleAnalytics />
        {/* Site-wide structured data. Page-level schema is added per page. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

        <a href="#main" className="skip">Skip to content</a>

        {/* Never rendered on www.merahissa.in. It exists because the two sites
            are otherwise identical, and testing a payment against the live site
            by mistake is the exact thing this environment split is for. */}
        {!isProductionDeploy() && (
          <div className="env-banner" role="status">
            Staging &mdash; Razorpay test mode. No real payment is taken here, and
            this site is not indexed by search engines.
          </div>
        )}

        <div className="shell">
          <header className="masthead">
            <Link href="/" className="wordmark-link">
              <span className="wordmark">Mera Hissa<span className="dot">.</span></span>
            </Link>
            <nav className="nav-links" aria-label="Main">
              <Link href="/guides">Guides</Link>
              <Link href="/faq">Questions</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/triage" className="btn">Free check</Link>
            </nav>
          </header>

          <main id="main">{children}</main>

          {/* Load-bearing, not boilerplate: this wording is what keeps the
              service lawful for a non-advocate operator. It appears on every
              page and inside every generated pack. */}
          <footer className="site-footer">
            {/* The closing wordmark. Decorative — the same words are already in
                the masthead link and the footer heading below, so it is hidden
                from assistive tech rather than read out a third time. */}
            <div className="wordmark-band" aria-hidden="true">Mera Hissa</div>

            {/* Owns the footer's column headings so a heading-only page (e.g.
                /signin) does not skip from its h1 straight to the footer h3s. */}
            <h2 className="visually-hidden">About Mera Hissa</h2>
            <div className="foot-cols">
              <div>
                <h3>Mera Hissa</h3>
                <p>
                  We prepare the paperwork for transferring a deceased family
                  member&rsquo;s bank accounts, shares, mutual funds, insurance and
                  provident fund to their legal heirs.
                </p>
              </div>
              <div>
                <h3>Read first</h3>
                <ul>
                  <li><Link href="/guides/claim-bank-account-after-death">Claiming a bank account</Link></li>
                  <li><Link href="/guides/succession-certificate-india">Succession certificates</Link></li>
                  <li><Link href="/guides/nominee-vs-legal-heir">Nominee vs legal heir</Link></li>
                  <li><Link href="/faq">All questions</Link></li>
                </ul>
              </div>
              <div>
                <h3>Reach us</h3>
                <ul>
                  <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
                  <li><a href={`tel:${SITE.phoneHref}`}>{SITE.phone}</a></li>
                  <li><Link href="/contact">Ask us a question</Link></li>
                  <li><Link href="/privacy">Privacy</Link></li>
                  <li><Link href="/terms">Terms</Link></li>
                  <li><Link href="/refund">Refund &amp; cancellation</Link></li>
                </ul>
              </div>
            </div>

            <p className="disclaimer">
              Mera Hissa prepares documents and explains the steps involved in claiming
              assets left by a family member. We are not a law firm and this is not legal
              advice. We do not represent anyone before a court or tribunal. Where a case
              needs a succession certificate, probate, or letters of administration, we
              refer you to an advocate.
            </p>
            <p className="disclaimer">
              Your documents are stored encrypted, are never used to train any AI system,
              and are deleted 90 days after your case closes. You can ask us to delete
              everything at any time.
            </p>
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
