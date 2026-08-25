import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GUIDES, guideBySlug } from '@/lib/guides';
import { pageMeta, breadcrumbJsonLd, howToJsonLd, JsonLd, SITE } from '@/lib/seo';

/** Static generation: these are the pages that need to be fast for crawlers. */
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) return {};

  return pageMeta({ title: guide.title, description: guide.description, path: `/guides/${slug}` });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();

  const related = guide.related.map(guideBySlug).filter(Boolean);

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: guide.h1, path: `/guides/${guide.slug}` },
        ]),
        howToJsonLd(),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.h1,
          description: guide.description,
          dateModified: guide.updated,
          inLanguage: 'en-IN',
          publisher: { '@id': `${SITE.url}/#organization` },
          mainEntityOfPage: `${SITE.url}/guides/${guide.slug}`,
        },
      ]} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span>/</span> <Link href="/guides">Guides</Link>
      </nav>

      <article>
        <h1>{guide.h1}</h1>

        {/* The answer comes first. Nobody in this situation wants a preamble. */}
        <div className="answer-first">
          <p>{guide.answer}</p>
        </div>

        {guide.sections.map((s) => (
          <section className="sect" key={s.heading}>
            <h2>{s.heading}</h2>
            {s.body.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
          </section>
        ))}

        <section className="sect">
          <h2>Find out what your case needs</h2>
          <p className="sub">
            The free check applies all of the above to your actual family and your actual
            accounts, and tells you the shares and the document list in two minutes.
          </p>
          <div className="cta-row">
            <Link href="/triage">
              <button className="btn btn-lg" type="button">Check my case</button>
            </Link>
            <span className="cta-note">Free &middot; no account needed</span>
          </div>
        </section>

        {related.length > 0 && (
          <section className="sect">
            <h2>Related</h2>
            <ul>
              {related.map((r) => (
                <li key={r!.slug}><Link href={`/guides/${r!.slug}`}>{r!.h1}</Link></li>
              ))}
            </ul>
          </section>
        )}

        <p className="hint" style={{ marginTop: '2rem' }}>
          Last reviewed {guide.updated}. This is general information, not legal advice.
          Institution requirements change &mdash; confirm before you file.
        </p>
      </article>
    </>
  );
}
