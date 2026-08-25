import Link from 'next/link';
import { FAQS, TOPIC_ORDER, TOPIC_LABELS, faqsByTopic } from '@/lib/faq';
import { pageMeta, faqJsonLd, breadcrumbJsonLd, JsonLd } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Common questions about claiming a deceased family member\'s money',
  description:
    'Do you need a succession certificate? Does the nominee keep the money? '
    + 'Straight answers to what families ask after a death in India.',
  path: '/faq',
});

/**
 * FAQ.
 *
 * Uses <details>/<summary> rather than JavaScript accordions: it works before
 * hydration, it is keyboard accessible for free, browser find-in-page reaches
 * collapsed content, and Google indexes it normally. There is no reason to
 * reimplement this in React.
 */
export default function FaqPage() {
  return (
    <>
      <JsonLd data={[
        faqJsonLd(),
        breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Questions', path: '/faq' }]),
      ]} />

      <h1>Questions families ask us</h1>
      <p className="sub">
        Straight answers, including the ones that mean you do not need us. If your
        question is not here, <Link href="/contact">ask us directly</Link> &mdash; we
        answer within a working day.
      </p>

      {TOPIC_ORDER.map((topic) => (
        <section className="sect" key={topic}>
          <h2>{TOPIC_LABELS[topic]}</h2>
          <div className="faq-list">
            {faqsByTopic(topic).map((f) => (
              <details className="faq" key={f.id} id={f.id}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="sect">
        <h2>Still not sure where you stand?</h2>
        <p className="sub">
          The free check answers the two questions underneath most of the above: what
          each person inherits, and which documents your institutions will ask for.
        </p>
        <div className="cta-row">
          <Link href="/triage">
            <button className="btn btn-lg" type="button">Check what my case needs</button>
          </Link>
          <span className="cta-note">Free &middot; no account &middot; two minutes</span>
        </div>
      </section>

      <p className="hint" style={{ marginTop: '2rem' }}>
        {FAQS.length} questions, last reviewed August 2026. Requirements change &mdash;
        confirm anything time-sensitive with the institution before you file.
      </p>
    </>
  );
}
