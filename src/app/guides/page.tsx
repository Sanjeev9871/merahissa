import Link from 'next/link';
import { GUIDES } from '@/lib/guides';
import { pageMeta, breadcrumbJsonLd, JsonLd } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Guides to claiming a deceased person\'s assets in India',
  description:
    'Free, complete guides to bank account transmission, succession certificates, '
    + 'legal heir certificates, IEPF share recovery and inheritance shares.',
  path: '/guides',
});

export default function GuidesIndex() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/' }, { name: 'Guides', path: '/guides' },
      ])} />

      <h1>Guides</h1>
      <p className="sub">
        Complete answers, free, with nothing held back for a paywall. If one of these
        solves your problem without us, that is a good outcome.
      </p>

      {/* Eager, not lazy: it is above the fold, and lazy-loading an LCP image
          delays the very thing the page is measured on. */}
      <figure className="banner">
        <img
          src="/img/guides-reading-1200.webp"
          srcSet="/img/guides-reading-600.webp 600w, /img/guides-reading-1200.webp 1200w"
          sizes="(max-width: 60rem) 100vw, 60rem"
          width={1200} height={400} decoding="async" fetchPriority="high"
          alt="Open books stacked on a wooden table in warm light."
        />
      </figure>

      <div className="guide-list">
        {GUIDES.map((g) => (
          <Link href={`/guides/${g.slug}`} key={g.slug} className="guide-card">
            <h2>{g.h1}</h2>
            <p>{g.description}</p>
            <span className="hint">Updated {g.updated}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
