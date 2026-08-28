'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window { Razorpay?: new (options: unknown) => { open: () => void } }
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

    new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: 'INR',
      name: 'Mera Hissa',
      description: order.tierLabel,
      // We do NOT mark the case paid here. The webhook is what actually records
      // payment, because a client callback can be skipped, replayed or forged.
      // So the case has almost certainly NOT flipped to 'paid' yet: clear the
      // spinner and show an explicit "confirming" state rather than leaving the
      // Pay button stuck reading "Opening payment…" as if nothing happened.
      handler: () => { setBusy(false); setPaidPending(true); router.refresh(); },
      modal: { ondismiss: () => setBusy(false) },
      theme: { color: '#6b4423' },
    }).open();
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
          <h2>Payment received</h2>
          <p>
            Thank you. We are confirming it with the bank &mdash; this usually takes a few
            moments. Refresh this page shortly to continue.
          </p>
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
