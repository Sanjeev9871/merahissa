import Link from 'next/link';
import { STATES } from '@/lib/states';
import { pageMeta, breadcrumbJsonLd, JsonLd, SITE } from '@/lib/seo';

/**
 * The hub for the state pages.
 *
 * This page and /guides/legal-heir-certificate deliberately answer different
 * questions, because two pages competing for the same query help nobody. The
 * guide answers "what is this document and when do I need it", nationally.
 * This page answers "where do I go, in my state" — and its whole value is the
 * table, because the answer changes at every state border.
 */
export const metadata = pageMeta({
  title: 'Legal heir certificate by state: where to apply',
  description:
    'A legal heir certificate is issued by your state, not by any central authority. '
    + 'The portal, the form, the issuing officer and the name itself change state by state.',
  path: '/legal-heir-certificate',
});

export default function StatesIndex() {
  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Guides', path: '/guides' },
          { name: 'Legal heir certificate', path: '/legal-heir-certificate' },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'Legal heir certificate, by state',
          itemListElement: STATES.map((s, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: `Legal heir certificate in ${s.name}`,
            url: `${SITE.url}/legal-heir-certificate/${s.slug}`,
          })),
        },
      ]} />

      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span>/</span> <Link href="/guides">Guides</Link>
      </nav>

      <h1>Legal heir certificate, state by state</h1>

      <div className="answer-first">
        <p>
          There is no central legal heir certificate. It is issued under each state&rsquo;s own
          revenue administration, which means the issuing officer, the portal, the form number
          and sometimes the name of the document itself all change at the state border. Delhi
          does not issue one at all &mdash; it issues a Surviving Member Certificate. Karnataka
          issues a Surviving Family Member Certificate, and a different document again called
          Vamsha Vruksha. Tamil Nadu lists it under a service code, REV-114, that nothing else
          will match.
        </p>
      </div>

      <p className="sub">
        Pick your state. Each page carries the real portal, the documents that office asks for,
        what families report it costing, and the one thing that state does differently.
      </p>

      <div className="guide-list">
        {STATES.map((s) => (
          <Link href={`/legal-heir-certificate/${s.slug}`} key={s.slug} className="guide-card">
            <h2>{s.name}</h2>
            <p>
              {s.certificate}, issued by the {s.authority}. Applied for through {s.portal.name}
              {s.serviceCode ? ` as ${s.serviceCode}` : ''}.
            </p>
            <span className="hint">Verified {s.verifiedOn}</span>
          </Link>
        ))}
      </div>

      <section className="sect">
        <h2>More states are coming</h2>
        <p>
          These six are published because they are the ones we have verified against the
          state&rsquo;s own portal. We would rather publish six pages that are right than
          twenty-eight that repeat each other. If your state is not here,{' '}
          <Link href="/guides/legal-heir-certificate">the national guide</Link> covers what the
          certificate proves and what to ask your own revenue office for.
        </p>
      </section>

      <section className="sect">
        <h2>Find out what your case needs</h2>
        <p className="sub">
          The free check tells you what each heir inherits and which documents each institution
          will ask for. Two minutes, no account.
        </p>
        <div className="cta-row">
          <Link href="/triage" className="btn btn-lg">Check my case</Link>
          <span className="cta-note">Free &middot; no account needed</span>
        </div>
      </section>
    </>
  );
}
