import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SITE, organizationJsonLd, websiteJsonLd, JsonLd } from '@/lib/seo';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        {/* Site-wide structured data. Page-level schema is added per page. */}
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

        <a href="#main" className="skip">Skip to content</a>

        <div className="shell">
          <header className="masthead">
            <Link href="/" className="wordmark-link">
              <span className="wordmark">Mera Hissa<span className="dot">.</span></span>
            </Link>
            <nav className="nav-links" aria-label="Main">
              <Link href="/guides">Guides</Link>
              <Link href="/faq">Questions</Link>
              <Link href="/contact">Contact</Link>
            </nav>
          </header>

          <main id="main">{children}</main>

          {/* Load-bearing, not boilerplate: this wording is what keeps the
              service lawful for a non-advocate operator. It appears on every
              page and inside every generated pack. */}
          <footer className="site-footer">
            {/* Owns the footer's column headings so a heading-only page (e.g.
                /signin) does not skip from its h1 straight to the footer h3s. */}
            <h2 className="visually-hidden">About Mera Hissa</h2>
            <div className="foot-cols">
              <div>
                <h3>Mera Hissa</h3>
                <p>
                  We prepare the paperwork for transferring a deceased family member&rsquo;s
                  bank accounts, shares, mutual funds, insurance and provident fund to their
                  legal heirs.
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
                  <li><a href={`tel:${SITE.phone}`}>{SITE.phone}</a></li>
                  <li><Link href="/contact">Ask us a question</Link></li>
                  <li><Link href="/privacy">Privacy</Link></li>
                </ul>
              </div>
            </div>

            <p className="disclaimer">
              Mera Hissa prepares documents and explains the steps involved in claiming assets
              left by a family member. We are not a law firm and this is not legal advice.
              We do not represent anyone before a court or tribunal. Where a case needs a
              succession certificate, probate, or letters of administration, we refer you
              to an advocate.
            </p>
            <p className="disclaimer">
              Your documents are stored encrypted, are never used to train any AI system,
              and are deleted 90 days after your case closes. You can ask us to delete
              everything at any time.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}