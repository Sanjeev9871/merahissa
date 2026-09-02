import Link from 'next/link';
import { pageMeta, SITE } from '@/lib/seo';

export const metadata = pageMeta({
  title: 'Refund and cancellation policy',
  description:
    'When and how Mera Hissa refunds its one-time fee, how to cancel, and how long a '
    + 'refund takes to reach your original payment method.',
  path: '/refund',
});

/**
 * Refund and cancellation policy.
 *
 * Restates the refund commitment already made on the site and in the terms
 * (one fixed fee, refunded where we cannot help, no subscription), in the
 * clearly-labelled, standalone form a payment provider's verification expects.
 * The processing window is a business commitment — adjust it if operations
 * differ.
 */
export default function Refund() {
  return (
    <>
      <h1>Refund and cancellation policy</h1>
      <p className="hint">Version 2026-08-31</p>

      <p>
        Mera Hissa charges a <strong>single fixed fee per case</strong>, shown to you in
        full before you pay. There is no subscription and nothing auto-renews or
        re-charges your card. This policy explains when that fee is refunded and how to
        ask for a refund.
      </p>

      <h2>Before you pay</h2>
      <p>
        The free check runs before any payment and tells you what your case needs,
        including whether it needs an advocate rather than us. If it is not something we
        can help with, you learn that <strong>before</strong> paying, not after. You can
        stop at any point up to payment at no cost.
      </p>

      <h2>When we refund the fee</h2>
      <ul>
        <li>
          <strong>If we cannot help with your matter.</strong> If, after you pay, we find
          your case cannot be completed with the documents we prepare, we refund the fee
          in full.
        </li>
        <li>
          <strong>If we have not started preparing your documents.</strong> If you change
          your mind before we have begun work on your pack, tell us and we refund the fee
          in full.
        </li>
        <li>
          <strong>If you were charged in error</strong> &mdash; for example a duplicate
          payment &mdash; we refund the extra amount.
        </li>
      </ul>

      <h2>What is not refundable</h2>
      <p>
        Once a pack has been prepared and delivered to you, the fee for that pack is not
        refundable, because the work has been done. Third-party costs you pay directly to
        others &mdash; stamp paper, notarisation, court or government fees &mdash; are
        never paid to us and are outside this policy.
      </p>

      <h2>How to request a refund or cancel</h2>
      <p>
        Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or call{' '}
        <a href={`tel:${SITE.phoneHref}`}>{SITE.phone}</a> with your case details. There
        is no form to fill in and no retention offer to sit through &mdash; cancelling is
        no harder than starting.
      </p>

      <h2>How long a refund takes</h2>
      <p>
        Approved refunds are made to your <strong>original payment method</strong> through
        our payment provider, Razorpay. They typically reach your account within{' '}
        <strong>5&ndash;7 working days</strong>, depending on your bank or card issuer.
      </p>

      <p className="hint" style={{ marginTop: '2rem' }}>
        This policy sits alongside our <Link href="/terms">terms of service</Link> and{' '}
        <Link href="/privacy">privacy notice</Link>.
      </p>
    </>
  );
}
