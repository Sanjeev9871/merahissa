import Link from 'next/link';

// Rendered inside the root layout, so the masthead and footer are already
// there — this is just the main content of the 404.
export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <>
      <h1>We could not find that page</h1>
      <p className="sub">
        The link may be old, or the address may have a typo. Nothing is lost &mdash; here
        is where most people are heading.
      </p>

      <div className="cta-row" style={{ marginTop: '1.5rem' }}>
        <Link href="/triage" className="btn btn-lg">Check what my case needs</Link>
        <span className="cta-note">Free &middot; no account needed</span>
      </div>

      <section className="sect">
        <h2>Or start from one of these</h2>
        <ul>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/guides">Guides</Link> &mdash; how to claim each kind of asset</li>
          <li><Link href="/faq">Questions families ask us</Link></li>
          <li><Link href="/contact">Contact us</Link></li>
        </ul>
      </section>
    </>
  );
}
