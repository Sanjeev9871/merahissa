import Link from 'next/link';
import { notFound } from 'next/navigation';
import { STATES, stateBySlug, stateFaqs } from '@/lib/states';
import { RBI_DECEASED_CLAIMS, THRESHOLD_CAVEAT } from '@/lib/rbi-directions';
import { pageMeta, breadcrumbJsonLd, JsonLd, SITE } from '@/lib/seo';

/** Static generation: these are the pages that need to be fast for crawlers. */
export function generateStaticParams() {
  return STATES.map((s) => ({ state: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const s = stateBySlug(state);
  if (!s) return {};

  return pageMeta({
    title: s.title,
    description: s.description,
    path: `/legal-heir-certificate/${s.slug}`,
  });
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const s = stateBySlug(state);
  if (!s) notFound();

  const faqs = stateFaqs(s);
  const others = STATES.filter((o) => o.slug !== s.slug);

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Legal heir certificate', path: '/legal-heir-certificate' },
          { name: s.name, path: `/legal-heir-certificate/${s.slug}` },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: s.h1,
          description: s.description,
          dateModified: s.verifiedOn,
          inLanguage: 'en-IN',
          publisher: { '@id': `${SITE.url}/#organization` },
          mainEntityOfPage: `${SITE.url}/legal-heir-certificate/${s.slug}`,
        },
        // Built from stateFaqs(), the same call that renders the visible
        // section below, so the two cannot disagree.
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        },
      ]} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span>/</span>{' '}
        <Link href="/guides">Guides</Link> <span>/</span>{' '}
        <Link href="/legal-heir-certificate">Legal heir certificate</Link>
      </nav>

      <article>
        <h1>{s.h1}</h1>

        <div className="answer-first">
          <p>{s.answer}</p>
        </div>

        <section className="sect">
          <h2>At a glance</h2>
          <dl className="facts">
            <div><dt>Called</dt><dd>{s.certificate}{s.alsoCalled ? ` · ${s.alsoCalled}` : ''}</dd></div>
            <div><dt>Issued by</dt><dd>{s.authority}</dd></div>
            <div>
              <dt>Apply at</dt>
              <dd>
                <a href={s.portal.url} rel="noopener noreferrer" target="_blank">{s.portal.name}</a>
                {s.serviceCode ? <> &middot; service <strong>{s.serviceCode}</strong></> : null}
              </dd>
            </div>
            <div><dt>Reported cost</dt><dd>{s.fee}</dd></div>
            <div><dt>Reported time</dt><dd>{s.timeline}</dd></div>
          </dl>
          <p className="hint">
            Cost and time are what families report, not figures the state publishes as a
            commitment. {s.varies}
          </p>
        </section>

        <section className="sect">
          <h2>What you will need</h2>
          <ul>
            {s.documents.map((d) => <li key={d}>{d}</li>)}
          </ul>
        </section>

        <section className="sect">
          <h2>What is different in {s.name}</h2>
          {s.localDetail.map((p) => <p key={p.slice(0, 40)}>{p}</p>)}
        </section>

        <section className="sect">
          <h2>Will this be enough, or do you need a court?</h2>
          <p>
            A heir certificate is a revenue document, not a court order, and for most families
            it is enough. Under the{' '}
            <a href={RBI_DECEASED_CLAIMS.url} rel="noopener noreferrer" target="_blank">
              {RBI_DECEASED_CLAIMS.name}
            </a>
            , every bank has to fix a threshold below which it settles a deceased customer&rsquo;s
            account without sending the family to court &mdash; and that threshold cannot be lower
            than {RBI_DECEASED_CLAIMS.thresholdFloor.scheduledBank} at a scheduled bank, or{' '}
            {RBI_DECEASED_CLAIMS.thresholdFloor.cooperativeBank} at a co-operative bank.
          </p>
          <p>{THRESHOLD_CAVEAT}</p>
          <p>
            Below the limit, the bank works from a claim form, the death certificate, identity
            proof, an indemnity bond and no-objection letters from the heirs who are not claiming.
            Above it, it can require a succession certificate &mdash; a civil court petition that
            realistically takes six months or more. That gap is the whole reason it is worth asking
            before you file anything.
          </p>
        </section>

        <section className="sect">
          <h2>Common questions</h2>
          <dl className="qa">
            {faqs.map((f) => (
              <div key={f.q}>
                <dt>{f.q}</dt>
                <dd>{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="sect">
          <h2>Find out what your case needs</h2>
          <p className="sub">
            The free check works out what each heir inherits and which documents each
            institution on your list will ask for &mdash; in about two minutes.
          </p>
          <div className="cta-row">
            <Link href="/triage" className="btn btn-lg">Check my case</Link>
            <span className="cta-note">Free &middot; no account needed</span>
          </div>
        </section>

        <section className="sect">
          <h2>Other states</h2>
          <ul>
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/legal-heir-certificate/${o.slug}`}>
                  Legal heir certificate in {o.name}
                </Link>
              </li>
            ))}
          </ul>
          <p>
            For the national picture &mdash; what the certificate proves, and when an
            institution will want a succession certificate instead &mdash; see{' '}
            <Link href="/guides/legal-heir-certificate">the legal heir certificate guide</Link>.
          </p>
        </section>

        <p className="hint" style={{ marginTop: '2rem' }}>
          Verified {s.verifiedOn} against the {s.portal.name} portal and the state&rsquo;s own
          published guidance. This is general information, not legal advice. State procedure is
          revised without notice &mdash; confirm at the office before you file.
        </p>
      </article>
    </>
  );
}
