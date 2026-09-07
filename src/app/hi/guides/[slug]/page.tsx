import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES } from '@/lib/guides';
import { guideBySlugLocalized } from '@/lib/guides.hi';
import { pageMeta, breadcrumbJsonLd, JsonLd, SITE } from '@/lib/seo';
import { UI } from '@/lib/i18n';

const t = UI.hi;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = guideBySlugLocalized(slug, 'hi');
  if (!found) return {};

  return pageMeta({
    title: found.guide.title,
    description: found.guide.description,
    path: `/hi/guides/${slug}`,
  });
}

export default async function HindiGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = guideBySlugLocalized(slug, 'hi');
  if (!found) notFound();

  const { guide, translated } = found;
  const related = guide.related
    .map((r) => guideBySlugLocalized(r, 'hi'))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: t.notFound.home, path: '/hi' },
          { name: t.nav.guides, path: '/hi/guides' },
          { name: guide.h1, path: `/hi/guides/${guide.slug}` },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.h1,
          description: guide.description,
          dateModified: guide.updated,
          inLanguage: 'hi-IN',
          publisher: { '@id': `${SITE.url}/#organization` },
          mainEntityOfPage: `${SITE.url}/hi/guides/${guide.slug}`,
        },
      ]} />

      <nav className="crumbs" aria-label="ब्रेडक्रम्ब">
        <Link href="/hi">{t.notFound.home}</Link> <span>/</span>{' '}
        <Link href="/hi/guides">{t.nav.guides}</Link>
      </nav>

      <article>
        <h1>{guide.h1}</h1>

        {/* Honest about a missing translation rather than silently serving
            English to someone who came to the Hindi site. */}
        {!translated && (
          <div className="notice warn" role="note" lang="hi-IN">
            {t.fallbackNotice}
          </div>
        )}

        <div className="answer-first" lang={translated ? 'hi-IN' : 'en-IN'}>
          <p>{guide.answer}</p>
        </div>

        <div lang={translated ? 'hi-IN' : 'en-IN'}>
          {guide.sections.map((s) => (
            <section className="sect" key={s.heading}>
              <h2>{s.heading}</h2>
              {s.body.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
            </section>
          ))}
        </div>

        <section className="sect">
          <h2>जानिए आपके मामले में क्या चाहिए</h2>
          <p className="sub">
            निःशुल्क जाँच ऊपर की सारी बातें आपके अपने परिवार और आपके अपने खातों पर लागू करती है,
            और दो मिनट में हिस्से तथा दस्तावेज़ों की सूची बता देती है।
          </p>
          <div className="cta-row">
            <Link href="/hi/triage" className="btn btn-lg">{t.cta.check}</Link>
            <span className="cta-note">{t.cta.checkNote}</span>
          </div>
        </section>

        {related.length > 0 && (
          <section className="sect">
            <h2>{t.guideMeta.related}</h2>
            <ul>
              {related.map((r) => (
                <li key={r.guide.slug}>
                  <Link href={`/hi/guides/${r.guide.slug}`}>{r.guide.h1}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="hint" style={{ marginTop: '2rem' }}>
          {t.guideMeta.lastReviewed} {guide.updated}. {t.guideMeta.notLegalAdvice}
        </p>
      </article>
    </>
  );
}
