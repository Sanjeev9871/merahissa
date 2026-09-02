import Link from 'next/link';
import { pageMeta, SITE } from '@/lib/seo';

// noindex: a thank-you page has no business in search results, and it is left
// out of the sitemap for the same reason.
export const metadata = pageMeta({
  title: 'Thank you',
  description: 'We have your message and will be in touch within one working day.',
  path: '/thank-you',
  index: false,
});

export default function ThankYou() {
  return (
    <>
      <h1>Thank you &mdash; we have your details</h1>
      <p className="sub">
        Someone at Mera Hissa will be in touch within one working day. If it is urgent,
        email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call{' '}
        <a href={`tel:${SITE.phoneHref}`}>{SITE.phone}</a> and we will move it up.
      </p>

      <div className="cta-row" style={{ marginTop: '1.5rem' }}>
        <Link href="/guides" className="btn btn-lg">Read a guide while you wait</Link>
      </div>

      <p className="hint" style={{ marginTop: '2rem' }}>
        Nothing more is needed from you right now.
      </p>
    </>
  );
}
