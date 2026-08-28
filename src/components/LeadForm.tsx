'use client';

import { useState } from 'react';
import type { LeadSource } from '@/lib/leads';
import { SITE } from '@/lib/site';

/**
 * Contact capture.
 *
 * Never a gate. This appears AFTER someone has been given their answer, framed
 * as an offer rather than a toll. The two consents are separate checkboxes
 * because bundling "contact me about my case" with "send me updates" is
 * exactly the pattern the DPDP Act is aimed at.
 *
 * Either an email or a mobile is enough — insisting on both costs conversions
 * and gains nothing, since we only need one way to reach someone.
 */
export function LeadForm({ source, caseSummary, heading, blurb }: {
  source: LeadSource;
  caseSummary?: Record<string, unknown>;
  heading?: string;
  blurb?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, message, source, caseSummary,
          consentToContact: consent, consentToUpdates: updates,
        }),
      });

      if (res.ok) { setState('done'); return; }

      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'We could not send that just now. Please try again.');
      setState('idle');
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="card">
        <h2>Thank you &mdash; we have your details</h2>
        <p style={{ margin: 0 }}>
          Someone will be in touch within one working day. If it is urgent, email us at{' '}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> and we will move it up.
        </p>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{heading ?? 'Would you like us to take it from here?'}</h2>
      <p className="sub">
        {blurb ?? 'Leave a phone number or an email and we will walk you through what happens next. No obligation, and no charge for the conversation.'}
      </p>

      <div className="field">
        <label htmlFor="lead-name">Your name</label>
        <input id="lead-name" type="text" value={name} autoComplete="name"
          onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="lead-phone">Mobile number</label>
          <input id="lead-phone" type="tel" inputMode="tel" value={phone}
            autoComplete="tel" placeholder="98765 43210"
            onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-email">Email address</label>
          <input id="lead-email" type="email" value={email} autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <p className="hint" style={{ marginTop: '-0.6rem' }}>Either one is enough.</p>

      <div className="field">
        <label htmlFor="lead-message">Anything you want us to know first (optional)</label>
        <textarea id="lead-message" rows={3} value={message}
          onChange={(e) => setMessage(e.target.value)} />
      </div>

      {/* Two separate consents. Never one checkbox covering both purposes. */}
      <div className="field">
        <label className="check">
          <input type="checkbox" checked={consent} required
            onChange={(e) => setConsent(e.target.checked)} />
          <span>Yes, contact me about my case. I understand my details are stored securely and deleted if I ask.</span>
        </label>
      </div>
      <div className="field">
        <label className="check">
          <input type="checkbox" checked={updates}
            onChange={(e) => setUpdates(e.target.checked)} />
          <span>Also send me occasional updates about inheritance rules in India. (Optional &mdash; you can say no and still get help.)</span>
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <button className="btn" type="submit" disabled={state === 'sending' || !consent}>
        {state === 'sending' ? 'Sending…' : 'Ask us to get in touch'}
      </button>
    </form>
  );
}
