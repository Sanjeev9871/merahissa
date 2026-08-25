import Link from 'next/link';

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
 *   - Limits are stated as prominently as capabilities. Naming what we cannot
 *     do builds more trust here than any claim about what we can.
 *   - No testimonials, and we say why. Inventing them would be the first
 *     dishonest thing we did.
 *   - No urgency, no countdowns, no scarcity. Every growth pattern that works
 *     on a shopping site reads as predatory to someone who has just buried a
 *     parent.
 */
export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>
          The bank wants a succession certificate. The insurer wants something
          else. <em>Nobody has given you the whole list.</em>
        </h1>
        <p className="sub">
          Answer six questions about your family and what they left. We will tell
          you exactly which documents each institution needs, and what the law says
          each person inherits.
        </p>
        <div className="cta-row">
          <Link href="/triage">
            <button className="btn btn-lg" type="button">Find out what my case needs</button>
          </Link>
          <span className="cta-note">Free &middot; no account &middot; about two minutes</span>
        </div>
      </section>

      <section className="sect">
        <h2>Before you trust us with anything</h2>
        <p className="sub">Six things we would want to know, if we were you.</p>

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
        <h2>How it works</h2>
        <p className="sub">
          Five steps. We have marked the one that is genuinely slow, because everyone
          else hides it.
        </p>

        <ol className="flow">
          <li>
            <span className="dot">1</span>
            <span className="ft"><h3>The free check</h3><span className="when">2 minutes</span></span>
            <p>
              Six questions. No name, no email, no account. You get the shares under
              the law and the document list for each institution.
            </p>
          </li>
          <li>
            <span className="dot">2</span>
            <span className="ft"><h3>Tell us the details</h3><span className="when">15 minutes</span></span>
            <p>
              Only now do we ask who you are. Names as they appear on documents, which
              banks and funds, roughly how much. Never a full account number.
            </p>
          </li>
          <li>
            <span className="dot">3</span>
            <span className="ft"><h3>Pay the fixed fee</h3><span className="when">one payment</span></span>
            <p>
              You already know the price from step one. If we then find we cannot
              help, you are refunded.
            </p>
          </li>
          <li>
            <span className="dot">4</span>
            <span className="ft"><h3>We prepare, a person checks</h3><span className="when">1 working day</span></span>
            <p>
              Claim forms filled in, affidavits and indemnity bonds drafted for stamp
              paper, and a checklist per institution in the order things must actually
              be done.
            </p>
          </li>
          <li>
            <span className="dot">5</span>
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

      <section className="sect">
        <h2>What we cannot do</h2>
        <p className="sub">Worth reading before you spend anything.</p>
        <ul className="limits">
          <li><span className="x">&times;</span><span>We are not a law firm and cannot give you legal advice.</span></li>
          <li><span className="x">&times;</span><span>We cannot appear for you in any court or tribunal. Succession certificates and probate need an advocate &mdash; we prepare everything around them and can introduce you to one.</span></li>
          <li><span className="x">&times;</span><span>We cannot make an institution accept a claim, and we cannot make one move faster.</span></li>
          <li><span className="x">&times;</span><span>We cannot notarise anything, or buy your stamp paper for you.</span></li>
          <li><span className="x">&times;</span><span>We do not compute Muslim intestate shares. That needs school-specific rules a piece of software should not be guessing at, so those cases go to an advocate.</span></li>
        </ul>
      </section>

      <section className="sect">
        <h2>There are no customer quotes on this page</h2>
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
        <h2>Start with the free check</h2>
        <p className="sub">Six questions. Nothing is sent to us, and nothing is saved.</p>
        <div className="cta-row">
          <Link href="/triage">
            <button className="btn btn-lg" type="button">Find out what my case needs</button>
          </Link>
          <span className="cta-note">You can stop at any point</span>
        </div>
      </section>
    </>
  );
}
