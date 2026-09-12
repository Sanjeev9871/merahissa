import type { Metadata } from 'next';
import Link from 'next/link';
import { FAQS } from '@/lib/faq';

// A self-referencing canonical for the site's most important URL. Routed
// directly (not through pageMeta) so the layout's title.default is kept and the
// brand is not doubled by the template.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * Landing page.
 *
 * The person arriving here searched something like "how to claim my father's
 * shares after death", three weeks after a funeral. They are grieving, they
 * have been told three different things by three bank branches, and this
 * category is full of operators who take a cut of what they recover.
 *
 * Every decision on this page follows from that:
 *
 *   - No signup wall. The free check runs before we ask for anything, and it
 *     gives the real answer, not a teaser.
 *   - The price is on the page before any commitment.
 *   - Limits are stated as prominently as capabilities — literally, here: the
 *     one full-bleed dark band on the site is the list of things we cannot do.
 *   - No testimonials, and we say why. Inventing them would be the first
 *     dishonest thing we did.
 *   - No urgency, no countdowns, no scarcity.
 *
 * The hero preview is a drawn illustration of what the free check returns, and
 * it is labelled as one. It is not a screenshot of anyone's case, and the
 * institutions in it are named only as examples of the kinds of place a claim
 * goes to.
 */

/**
 * The questions worth answering before someone clicks, in the order a sceptical
 * reader actually reaches them: what do I even do, what does it cost, why are
 * you cheaper than the percentage people, is my data safe, are you lawyers,
 * and what happens when the AI is wrong.
 *
 * Pulled from the same FAQS array that /faq renders, so an answer can never be
 * edited in one place and go stale in the other. The FAQPage structured data
 * stays on /faq alone — the same markup on two URLs is duplicate structured
 * data, and /faq is the canonical home for it.
 */
const LANDING_FAQ_IDS = [
  'where-to-start', 'cost', 'why-not-percentage',
  'data-safety', 'is-this-legal-advice', 'ai-mistake',
] as const;

const LANDING_FAQS = LANDING_FAQ_IDS
  .map((id) => FAQS.find((f) => f.id === id))
  .filter((f): f is (typeof FAQS)[number] => Boolean(f));

const PREVIEW = [
  { who: 'State Bank of India', kind: 'Bank', tone: 'ready', status: 'Forms ready' },
  { who: 'LIC of India', kind: 'Insurance', tone: 'ready', status: 'Forms ready' },
  { who: 'EPFO', kind: 'Provident fund', tone: 'ready', status: 'Forms ready' },
  { who: 'CAMS / KFintech', kind: 'Mutual funds', tone: 'ready', status: 'Forms ready' },
  { who: 'HDFC Bank', kind: 'Fixed deposit', tone: 'ready', status: 'Forms ready' },
  { who: 'Demat — NSDL', kind: 'Shares', tone: 'court', status: 'Court needed' },
] as const;

export default function Home() {
  return (
    <>
      <section className="hero bleed">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Estate claim paperwork for Indian families</span>
            <h1>
              Nobody gave you <em>the whole list</em>.
            </h1>
            <p className="sub">
              The bank wants a succession certificate. The insurer wants something else.
              Answer six questions about your family and what they left, and we will tell
              you exactly which documents each institution needs — and what the law says
              each person inherits.
            </p>
            <div className="cta-row">
              <Link href="/triage" className="btn btn-lg">Find out what my case needs</Link>
              <Link href="/examples" className="quiet">See a worked example</Link>
            </div>
            <p className="cta-note" style={{ marginTop: '1.25rem', maxWidth: '32ch' }}>
              Free &middot; no account &middot; about two minutes. Nothing on that page is sent to us.
            </p>
          </div>

          <div className="preview" aria-labelledby="preview-heading">
            <div className="preview-head">
              <span className="eyebrow" id="preview-heading">What the free check returns</span>
              <span className="count">6 institutions &middot; 1 needs a court</span>
            </div>
            {PREVIEW.map((row) => (
              <div className="preview-row" data-tone={row.tone} key={row.who}>
                <span className="dot" aria-hidden="true" />
                <span className="who">{row.who}</span>
                <span className="chips">
                  <span className="chip">{row.kind}</span>
                  <span className="chip" data-tone={row.tone}>{row.status}</span>
                </span>
              </div>
            ))}
            <p className="preview-foot">
              <svg className="lock" aria-hidden="true" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2.2"
                   strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>
                An illustration, not a real case. Nothing on the free check is sent to us,
                and your own list names the exact form each institution wants.
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="How we handle your information">
        <div>
          <span className="tick" aria-hidden="true">&#10003;</span>
          <p><strong>Read on your device.</strong> Scans are processed in your browser. The AI only ever sees placeholders.</p>
        </div>
        <div>
          <span className="tick" aria-hidden="true">&#10003;</span>
          <p><strong>A fixed fee, never a percentage.</strong> Quoted before you create an account, and refunded if we cannot help.</p>
        </div>
        <div>
          <span className="tick" aria-hidden="true">&#10003;</span>
          <p><strong>Deleted after 90 days.</strong> Encrypted at rest, never used to train any AI, and erasable by you at any time.</p>
        </div>
      </section>

      <section className="sect">
        <span className="eyebrow">Before you trust us with anything</span>
        <h2>Six things we would want to know, if we were you</h2>

        <div className="trust">
          <div>
            <h3>You see the answer before you pay</h3>
            <p>
              The free check gives you the real shares under the law and the real
              document list &mdash; not a teaser. If that is all you needed, take it
              and go. Plenty of families will.
            </p>
          </div>
          <div>
            <h3>We say when you need a lawyer instead</h3>
            <p>
              Some cases cannot be done with paperwork alone. When yours is one of
              them, the free check says so and tells you why, before any money
              changes hands.
            </p>
          </div>
          <div>
            <h3>Your documents are read on your device</h3>
            <p>
              Scans are processed in your own browser. When we draft the letters, the
              AI is sent placeholders &mdash; never a name, an account number, a PAN
              or an Aadhaar. That is how it is built, not a promise about intentions.
            </p>
          </div>
          <div>
            <h3>One fixed fee, never a percentage</h3>
            <p>
              &#8377;4,999 to &#8377;24,999 depending on how many institutions are
              involved, quoted before you sign up. Anyone asking for a share of what
              you recover is a different kind of business.
            </p>
          </div>
          <div>
            <h3>We show you the section of the Act</h3>
            <p>
              Every share we calculate cites the provision it comes from &mdash; Hindu
              Succession Act s.10, Indian Succession Act s.33. You can check us, and
              so can the bank.
            </p>
          </div>
          <div>
            <h3>A person checks every pack</h3>
            <p>
              Software drafts it; a human reads it before it reaches you. If our
              templates are out of date for your bank, the case is held rather than
              sent.
            </p>
          </div>
        </div>
      </section>

      <section className="sect">
        {/* Alt text describes what is in the frame and nothing more. Calling the
            hands in a stock photograph "a family we helped" would be inventing a
            customer, which this site has committed not to do — and would breach
            the licence's no-implied-endorsement term into the bargain. */}
        <div className="media" style={{ marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
          <figure className="shot">
            <img
              src="/img/papers-in-order-1200.webp"
              srcSet="/img/papers-in-order-600.webp 600w, /img/papers-in-order-1200.webp 1200w"
              sizes="(max-width: 52rem) 100vw, 45vw"
              width={1200} height={900} loading="lazy" decoding="async"
              alt="A hand resting on a stack of document folders in soft daylight."
            />
          </figure>
          <div>
            <span className="eyebrow">How it works</span>
            <h2>Five steps, and we have marked the slow one</h2>
            <p className="sub" style={{ marginBottom: 0 }}>
              Everyone else hides it. Prefer to see it rather than read it?{' '}
              <Link href="/examples">Three worked examples</Link> show what a case looks
              like, start to finish &mdash; and a short film of a finished pack.
            </p>
          </div>
        </div>

        <ol className="flow">
          <li>
            <span className="dot">01</span>
            <span className="ft"><h3>The free check</h3><span className="when">2 minutes</span></span>
            <p>
              Six questions. No name, no email, no account. You get the shares under
              the law and the document list for each institution.
            </p>
          </li>
          <li>
            <span className="dot">02</span>
            <span className="ft"><h3>Tell us the details</h3><span className="when">15 minutes</span></span>
            <p>
              Only now do we ask who you are. Names as they appear on documents, which
              banks and funds, roughly how much, and the account numbers the claim forms
              need &mdash; stored encrypted and shown back to you masked.
            </p>
          </li>
          <li>
            <span className="dot">03</span>
            <span className="ft"><h3>Pay the fixed fee</h3><span className="when">one payment</span></span>
            <p>
              You already know the price from step one. If we then find we cannot
              help, you are refunded.
            </p>
          </li>
          <li>
            <span className="dot">04</span>
            <span className="ft"><h3>We prepare, a person checks</h3><span className="when">1 working day</span></span>
            <p>
              Claim forms filled in, affidavits and indemnity bonds drafted for stamp
              paper, and a checklist per institution in the order things must actually
              be done.
            </p>
          </li>
          <li>
            <span className="dot">05</span>
            <span className="ft">
              <h3>You file, and we track it</h3>
              <span className="when" data-slow="yes">weeks to months</span>
            </span>
            <p>
              This is the slow part and no service can change that. A straightforward
              bank transmission takes a few weeks. Anything needing a succession
              certificate is a court application &mdash; six months or more. We tell
              you which yours is at step one.
            </p>
          </li>
        </ol>
      </section>

      {/* The one place on the site that changes colour. It is not the sales
          pitch — it is the list of things we cannot do. That is deliberate. */}
      <section className="band bleed">
        <div className="band-inner">
          <span className="eyebrow">Worth reading before you spend anything</span>
          <h2>What we cannot do</h2>
          <ul className="limits">
            <li><span className="x" aria-hidden="true">&times;</span><span>We are not a law firm and cannot give you legal advice.</span></li>
            <li><span className="x" aria-hidden="true">&times;</span><span>We cannot appear for you in any court or tribunal. Succession certificates and probate need an advocate &mdash; we prepare everything around them and can introduce you to one.</span></li>
            <li><span className="x" aria-hidden="true">&times;</span><span>We cannot make an institution accept a claim, and we cannot make one move faster.</span></li>
            <li><span className="x" aria-hidden="true">&times;</span><span>We cannot notarise anything, or buy your stamp paper for you.</span></li>
            <li><span className="x" aria-hidden="true">&times;</span><span>We do not compute Muslim intestate shares. That needs school-specific rules a piece of software should not be guessing at, so those cases go to an advocate.</span></li>
          </ul>
        </div>
      </section>

      <section className="sect">
        <span className="eyebrow">On this page you will not find</span>
        <h2>There are no customer quotes here</h2>
        <div className="plain-note">
          <p>
            <strong>We are new, and inventing testimonials would be the first
            dishonest thing we did.</strong> When real families have used this and are
            willing to be named, they will appear here, with their permission.
          </p>
          <p style={{ margin: 0 }}>
            Until then, judge us on the free check. It costs you nothing and it will
            tell you within two minutes whether we understand your situation.
          </p>
        </div>
      </section>

      <section className="sect">
        <span className="eyebrow">Frequently asked</span>
        <h2>The questions families ask us first</h2>
        <p className="sub">
          The awkward ones are here too. <Link href="/faq">All {FAQS.length} questions</Link>{' '}
          if you want the rest.
        </p>

        <div className="faq-list">
          {LANDING_FAQS.map((f) => (
            <details className="faq" key={f.id}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="closing">
        <span className="eyebrow">Start here</span>
        <h2>Six questions. Nothing is sent to us, and nothing is saved.</h2>
        <p className="sub">
          You can stop at any point, and you will still have the document list.
        </p>
        <div className="cta-row">
          <Link href="/triage" className="btn btn-lg">Find out what my case needs</Link>
          <Link href="/contact" className="quiet">Ask us a question</Link>
        </div>
      </section>
    </>
  );
}
