import Link from 'next/link';
import { guidesForLocale } from '@/lib/guides.hi';
import { pageMeta, breadcrumbJsonLd, JsonLd } from '@/lib/seo';
import { UI } from '@/lib/i18n';

const t = UI.hi;

export const metadata = pageMeta({
  title: 'मृतक की संपत्ति पर दावे की मार्गदर्शिकाएँ',
  description:
    'बैंक खाता, उत्तराधिकार प्रमाण पत्र, विधिक वारिस प्रमाण पत्र, IEPF शेयर और उत्तराधिकार में '
    + 'हिस्से — सब पर निःशुल्क और पूरी जानकारी, हिन्दी में।',
  path: '/hi/guides',
});

export default function HindiGuidesIndex() {
  const guides = guidesForLocale('hi');

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: t.notFound.home, path: '/hi' }, { name: t.nav.guides, path: '/hi/guides' },
      ])} />

      <h1>मार्गदर्शिकाएँ</h1>
      <p className="sub">
        पूरे जवाब, निःशुल्क, बिना कुछ छिपाए। अगर इनमें से कोई आपकी समस्या हमारे बिना ही हल कर दे,
        तो यह अच्छी बात है।
      </p>

      <div className="guide-list">
        {guides.map((g) => (
          <Link href={`/hi/guides/${g.slug}`} key={g.slug} className="guide-card">
            <h2>{g.h1}</h2>
            <p>{g.description}</p>
            <span className="hint">
              {t.guideMeta.lastReviewed} {g.updated}
              {!g.translated && ' · अंग्रेज़ी में'}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
