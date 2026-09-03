'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RazorpayCallback {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailure {
  error?: { description?: string; reason?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: 'payment.failed', handler: (e: RazorpayFailure) => void) => void;
}

declare global {
  interface Window { Razorpay?: new (options: unknown) => RazorpayInstance }
}

export function CaseActions({ caseId, status, tierLabel, priceLabel, deleteOnly }: {
  caseId: string;
  status: string;
  tierLabel?: string;
  priceLabel?: string;
  deleteOnly?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [paidPending, setPaidPending] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  async function pay() {
    setBusy(true); setError('');

    let order;
    try {
      const res = await fetch('/api/payments/order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });

      if (!res.ok) {
        setError('We could not start the payment. Please try again in a moment.');
        setBusy(false);
        return;
      }
      order = await res.json();
    } catch {
      setError('We could not reach the payment service. Please check your connection and try again.');
      setBusy(false);
      return;
    }

    // Loaded on demand so Razorpay's script is not on every page.
    await loadRazorpay();
    if (!window.Razorpay) {
      setError('The payment window could not load. Please check your connection.');
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: 'INR',
      name: 'Mera Hissa',
      description: order.tierLabel,
      // The callback is sent to our server to have its signature verified, so
      // the family sees the payment confirmed immediately instead of waiting on
      // the webhook. The webhook still records it independently — a browser
      // closed the moment after paying must not lose the payment.
      handler: (response: RazorpayCallback) => { void confirmPayment(response); },
      modal: { ondismiss: () => setBusy(false) },
      theme: { color: '#6b4423' },
    });

    // Razorpay reports a declined card or a failed UPI mandate here rather than
    // through the handler, so without this the modal simply closes and the user
    // is told nothing.
    rzp.on('payment.failed', (event: RazorpayFailure) => {
      setBusy(false);
      setPaidPending(false);
      setError(
        event?.error?.description
          ? `Payment failed: ${event.error.description}`
          : 'The payment did not go through. You have not been charged. Please try again.',
      );
    });

    rzp.open();
  }

  /** Sends the three checkout fields for server-side signature verification. */
  async function confirmPayment(response: RazorpayCallback) {
    setPaidPending(true);
    setError('');

    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      if (res.ok) {
        setBusy(false);
        setPaidPending(false);
        router.refresh();
        return;
      }

      // Verification failed. The money may still have left the account, and the
      // webhook may yet confirm it, so this must not read as "payment lost".
      setBusy(false);
      setError(
        'We received your payment but could not confirm it automatically. '
        + 'It is usually confirmed within a few minutes — refresh this page shortly. '
        + 'If it still shows as unpaid, contact us and we will sort it out.',
      );
    } catch {
      setBusy(false);
      setError(
        'We could not reach us to confirm the payment. If money has left your account, '
        + 'refresh this page in a few minutes — the confirmation usually arrives on its own.',
      );
    }
  }

  async function generate() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/cases/${caseId}/generate`, { method: 'POST' });
      if (res.ok) router.refresh();
      else setError('We could not prepare the documents just now. We have been notified.');
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/cases/${caseId}`, { method: 'DELETE' });
      if (res.ok) { router.push('/cases'); return; }
      setError('We could not delete this case.');
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    }
    setBusy(false);
  }

  if (deleteOnly) {
    return (
      <>
        <div className="field">
          <label htmlFor="confirm">Type DELETE to confirm</label>
          <input id="confirm" type="text" value={confirmText} style={{ maxWidth: '12rem' }}
            onChange={(e) => setConfirmText(e.target.value)} />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="button" className="quiet" disabled={busy || confirmText !== 'DELETE'}
          onClick={remove}>
          {busy ? 'Deleting…' : 'Delete everything'}
        </button>
      </>
    );
  }

  return (
    <div className="card">
      {error && <p className="error" role="alert">{error}</p>}

      {paidPending && (status === 'intake_complete' || status === 'awaiting_payment') && (
        <div role="status">
          <h2>Confirming your payment</h2>
          <p>Thank you. We are verifying it with the bank &mdash; this takes a moment.</p>
        </div>
      )}

      {!paidPending && (status === 'intake_complete' || status === 'awaiting_payment') && (
        <>
          <h2>Prepare my documents</h2>
          <p>{tierLabel} &mdash; <strong>{priceLabel}</strong>, one fixed fee.</p>
          <p className="hint">
            No percentage of anything you recover. If we cannot help, we refund you.
          </p>
          <button type="button" className="primary" disabled={busy} onClick={pay}>
            {busy ? 'Opening payment…' : `Pay ${priceLabel}`}
          </button>
        </>
      )}

      {status === 'paid' && (
        <>
          <h2>Ready to prepare</h2>
          <p>Your payment has come through. This takes a minute or two.</p>
          <button type="button" className="primary" disabled={busy} onClick={generate}>
            {busy ? 'Preparing…' : 'Prepare my documents'}
          </button>
        </>
      )}

      {(status === 'generating' || status === 'in_review') && (
        <>
          <h2>We are checking a few things</h2>
          <p>
            Someone at Mera Hissa is reviewing your pack before it comes to you. We will
            email you when it is ready &mdash; usually within one working day.
          </p>
        </>
      )}
    </div>
  );
}

function loadRazorpay(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve();
    s.onerror = () => resolve();   // caller checks window.Razorpay
    document.body.appendChild(s);
  });
}
