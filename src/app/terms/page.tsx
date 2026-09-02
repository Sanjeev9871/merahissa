import Link from 'next/link';
import { pageMeta, SITE } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Terms of service',
  description:
    'The terms on which Mera Hissa prepares estate claim documents: what the service '
    + 'does and does not do, fees and refunds, and the limits of our responsibility.',
  path: '/terms',
});

/**
 * Terms of service — SCAFFOLD.
 *
 * The structure and every clause restate commitments the site already makes
 * (fixed fee shown before payment, refund where we cannot help, not a law firm,
 * human review, data handling per the privacy notice). Nothing here invents a
 * new obligation. It still MUST be reviewed and finalised by a qualified
 * advocate before it is relied on — hence the visible notice below.
 */
export default function Terms() {
  return (
    <>
      <h1>Terms of service</h1>
      <p className="hint">Version 2026-08-31 &middot; draft</p>

      <div className="notice warn" role="note">
        <strong>This is a working draft.</strong>
        <p style={{ margin: '0.5rem 0 0' }}>
          These terms restate what we already promise elsewhere on the site, but they
          have not yet been reviewed by a lawyer. Do not treat them as final. If you are
          relying on them, write to <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
        </p>
      </div>

      <h2>1. Who we are</h2>
      <p>
        Mera Hissa (&ldquo;we&rdquo;, &ldquo;us&rdquo;) prepares the paperwork Indian
        families need to transfer a deceased relative&rsquo;s bank accounts, shares,
        mutual funds, insurance and provident fund to the legal heirs. By using this
        site you agree to these terms.
      </p>

      <h2>2. What the service does &mdash; and does not</h2>
      <p>
        We work out which documents each institution requires, compute the statutory
        shares, and prepare completed forms, affidavits and covering letters. A person
        reviews every pack before it reaches you.
      </p>
      <ul>
        <li>We are <strong>not a law firm</strong> and do not provide legal advice.</li>
        <li>We do not represent you before any court or tribunal.</li>
        <li>We cannot make an institution accept a claim, or make one move faster.</li>
        <li>We do not notarise documents or buy stamp paper.</li>
        <li>
          Some matters need an advocate (for example a succession certificate, probate,
          or Muslim intestate shares). Where yours does, the free check says so before
          any payment, and we can introduce you to one.
        </li>
      </ul>

      <h2>3. Your responsibilities</h2>
      <p>
        The documents we prepare are only as accurate as the details you give us. You
        are responsible for the names, relationships, institutions and figures you
        provide, and for checking the finished pack before you file it. Leaving out a
        legal heir is the commonest cause of a rejected claim.
      </p>

      <h2>4. Fees and refunds</h2>
      <p>
        The fee is a single fixed amount, shown to you before you pay, and never a
        percentage of what you recover. If, after you pay, we find we cannot help with
        your matter, we refund the fee.
      </p>
      <p>
        This is a <strong>one-time fee per case. There is no subscription, and nothing
        auto-renews or recharges your card.</strong> If you ever return for another
        matter, you pay for that matter, once, at the price shown before you commit.
      </p>

      <h2>5. No guarantee of outcome</h2>
      <p>
        Institution requirements change, and each institution decides its own process
        and timeline. We prepare your documents to the best current understanding of
        those requirements, but we cannot guarantee that a particular institution will
        accept a claim or act within any given time.
      </p>

      <h2>6. Your data</h2>
      <p>
        How we collect, use, store and delete your information is set out in our{' '}
        <Link href="/privacy">privacy notice</Link>, which forms part of these terms.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the extent the law allows, our liability for any claim arising out of your
        use of the service is limited to the fee you paid us for the matter concerned.
        We are not liable for a loss caused by inaccurate information you supplied, or by
        an institution&rsquo;s own decision or delay.
      </p>

      <h2>8. Changes to these terms</h2>
      <p>
        We may update these terms. The version date at the top shows when they last
        changed, and continued use of the site after a change means you accept the
        updated terms.
      </p>

      <h2>9. Governing law and contact</h2>
      <p>
        These terms are governed by the laws of India, and the courts at New Delhi have
        jurisdiction. Questions about them can go to{' '}
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or{' '}
        <a href={`tel:${SITE.phoneHref}`}>{SITE.phone}</a>.
      </p>
    </>
  );
}
