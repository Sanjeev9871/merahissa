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
