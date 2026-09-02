import Link from 'next/link';
import { pageMeta, breadcrumbJsonLd, JsonLd } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'What a case looks like: three worked examples',
  description:
    'Three illustrative estate-claim scenarios, worked through start to finish: who '
    + 'inherits what under the law, which documents each institution asks for, and '
    + 'when a case needs an advocate instead.',
  path: '/examples',
});

/**
 * Worked examples.
 *
 * These are ILLUSTRATIVE SCENARIOS, not customer stories, and the page says so
 * plainly. The landing page promises we will not invent testimonials, and that
 * promise holds here: nobody is quoted, nobody is named, and every "family" is
 * a hypothetical. The point is to show what the service actually does — the
 * shares are computed by the same rules engine the paid pack uses, and the
 * document lists come from the same requirements tables.
 */
export default function Examples() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/' }, { name: 'Examples', path: '/examples' },
      ])} />

      <h1>What a case looks like</h1>
      <p className="sub">
        Three worked examples, start to finish. Each shows what the law says each person
        inherits, which documents each institution will ask for, and &mdash; in one of
        them &mdash; the honest answer that the case needs an advocate.
      </p>

      <div className="notice" role="note">
        <strong>These are illustrative scenarios, not real customers.</strong> No one is
        quoted or named. We have not invented testimonials and will not &mdash; when real
        families are willing to be named, they will appear on the home page with their
        permission. These examples exist only to show what we do.
      </div>

      {/* ---------------------------------------------------------------- */}
      <section className="sect">
        <h2>Example 1 &mdash; a bank account with no nominee</h2>
        <p className="hint">Hindu family &middot; savings account, about &#8377;3 lakh &middot; no will, no nominee</p>

        <h3>The situation</h3>
        <p>
          A man dies without a will. He leaves a widow, a son and a daughter. His main
          asset is a savings account with a public sector bank holding roughly &#8377;3
          lakh. Nobody was registered as nominee. The branch has told the family three
          different things on three visits.
        </p>

        <h3>What the law says each person inherits</h3>
        <p>
          Under the Hindu Succession Act 1956, section 8, the estate passes to the Class I
          heirs &mdash; here the widow, the son and the daughter &mdash; and section 10
          gives each one equal share. Son and daughter take exactly the same.
        </p>
        <ul>
          <li>Widow &mdash; <strong>1/3</strong></li>
          <li>Son &mdash; <strong>1/3</strong></li>
          <li>Daughter &mdash; <strong>1/3</strong></li>
        </ul>

        <h3>What the bank will ask for</h3>
        <p>
          With no nominee and a balance under the bank&rsquo;s internal limit, this is
          settled without any court. The pack contains:
        </p>
        <ul>
          <li>Death certificate</li>
          <li>The bank&rsquo;s claim form for a deceased depositor</li>
          <li>Affidavit of heirship, naming all three heirs and their shares</li>
          <li>No-objection letters from the heirs who are not the claimant</li>
          <li>Indemnity bond on stamp paper</li>
          <li>Claimant&rsquo;s PAN and address proof</li>
        </ul>

        <h3>Outcome</h3>
        <p>
          No court, no advocate. One complete submission, typically settled in a few weeks.
          The commonest reason this kind of claim comes back is a missing NOC &mdash;
          which is why the pack insists every heir is listed.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="sect">
        <h2>Example 2 &mdash; a mother&rsquo;s insurance and shares</h2>
        <p className="hint">Hindu family &middot; life insurance with a nominee, plus demat shares &middot; no will</p>

        <h3>The situation</h3>
        <p>
          A woman dies without a will, survived by her husband, a son and a daughter. She
          held a life insurance policy on which her husband was the nominee, and a demat
          account of listed shares with no nomination.
        </p>

        <h3>What the law says each person inherits</h3>
        <p>
          For a Hindu woman, section 15(1)(a) puts her sons, daughters and husband first,
          and section 16 has them take equally:
        </p>
        <ul>
          <li>Husband &mdash; <strong>1/3</strong></li>
          <li>Son &mdash; <strong>1/3</strong></li>
          <li>Daughter &mdash; <strong>1/3</strong></li>
        </ul>
        <p>
          One thing the pack flags for the reviewer: section 15(2) sends property a woman
          inherited from her parents or husband back to that side of the family if she
          leaves no children. She does leave children here, so the split above stands
          &mdash; but the pack records the provenance of each asset, because a case where
          it matters is easy to miss.
        </p>

        <h3>Two assets, two very different routes</h3>
        <ul>
          <li>
            <strong>The insurance policy.</strong> Because the husband was named as
            nominee, this is the quick route: death claim form, original policy, the
            nominee&rsquo;s KYC, a cancelled cheque. Insurance is one of the narrow cases
            where a nominee who is a spouse, parent or child takes the money beneficially,
            not merely as a trustee.
          </li>
          <li>
            <strong>The demat shares.</strong> No nomination, so this goes by transmission:
            the depository&rsquo;s transmission request form, an affidavit of heirship, NOCs
            from the other two heirs, and an indemnity bond.
          </li>
        </ul>

        <h3>Outcome</h3>
        <p>
          No court for either asset. The pack is prepared as two parallel submissions,
          because there is nothing to gain by waiting for one before starting the other.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="sect">
        <h2>Example 3 &mdash; a sister, old shares, and the honest answer</h2>
        <p className="hint">Hindu family &middot; unmarried woman &middot; fixed deposit of about &#8377;12 lakh, plus shares transferred to the IEPF</p>

        <h3>The situation</h3>
        <p>
          An unmarried woman dies without a will. Both her parents are alive. She leaves a
          fixed deposit of roughly &#8377;12 lakh with no nominee, and a small parcel of
          shares bought decades ago that were transferred to the Investor Education and
          Protection Fund after years of unclaimed dividends. Her brother is handling the
          paperwork.
        </p>

        <h3>What the law says</h3>
        <p>
          The brother is <em>not</em> first in line. For a Hindu woman with no children
          and no husband, section 15(1)(c) gives the estate to her mother and father. The
          brother would inherit only if neither parent survived. So the claimants here are
          the parents, and the brother acts on their behalf:
        </p>
        <ul>
          <li>Mother &mdash; <strong>1/2</strong></li>
          <li>Father &mdash; <strong>1/2</strong></li>
        </ul>
        <p>
          This is exactly the kind of assumption the free check corrects before anyone
          files the wrong claim. See our guide on{' '}
          <Link href="/guides/claim-inheritance-when-sister-dies">claiming a sister&rsquo;s inheritance</Link>.
        </p>

        <h3>Two assets &mdash; one we handle, one that needs an advocate</h3>
        <ul>
          <li>
            <strong>The IEPF shares.</strong> Recoverable, and worth it. Form IEPF-5 is
            filed online, then a physical pack goes to the company&rsquo;s nodal officer:
            the acknowledgement, an indemnity bond, an advance receipt, the death
            certificate, proof of the parents&rsquo; entitlement, and a cancelled cheque.
            Slow &mdash; the company&rsquo;s entitlement letter is the step families stall
            on &mdash; but no court.
          </li>
          <li>
            <strong>The &#8377;12 lakh fixed deposit.</strong> No nominee and a balance well
            above the bank&rsquo;s internal limit. The bank will insist on a{' '}
            <Link href="/guides/succession-certificate-india">succession certificate</Link>
            &mdash; a civil court application under the Indian Succession Act, sections
            370 to 390. <strong>That needs an advocate, and we do not pretend
            otherwise.</strong>
          </li>
        </ul>

        <h3>Outcome</h3>
        <p>
          The free check tells the family this <em>before</em> they pay. We prepare
          everything around the court application &mdash; the IEPF pack, the affidavits,
          the heirship record &mdash; and can introduce them to an advocate for the
          certificate itself. Saying &ldquo;this part needs a lawyer&rdquo; at the start is
          the whole reason the check is free.
        </p>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section className="sect">
        <h2>Run your own case through the same rules</h2>
        <p className="sub">
          The shares above were computed by the same rules engine and the document lists
          drawn from the same tables we use for every paid pack. The free check applies
          them to your family and your accounts, in about two minutes.
        </p>
        <div className="cta-row">
          <Link href="/triage" className="btn btn-lg">Check what my case needs</Link>
          <span className="cta-note">Free &middot; no account &middot; nothing is stored</span>
        </div>
      </section>

      <p className="hint" style={{ marginTop: '2rem' }}>
        Illustrative examples only. This is general information, not legal advice, and
        institution requirements change &mdash; confirm before you file.
      </p>
    </>
  );
}
