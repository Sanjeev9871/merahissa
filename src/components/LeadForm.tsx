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
const COPY = {
  en: {
    doneHeading: 'Thank you — we have your details',
    doneBody: 'Someone will be in touch within one working day. If it is urgent, email us at',
    doneBodyEnd: 'and we will move it up.',
    defaultHeading: 'Would you like us to take it from here?',
    defaultBlurb:
      'Leave a phone number or an email and we will walk you through what happens next. '
      + 'No obligation, and no charge for the conversation.',
    name: 'Your name',
    phone: 'Mobile number',
    email: 'Email address',
    eitherIsEnough: 'Either one is enough.',
    message: 'Anything you want us to know first (optional)',
    consent:
      'Yes, contact me about my case. I understand my details are stored securely and deleted if I ask.',
    updates:
      'Also send me occasional updates about inheritance rules in India. (Optional — you can say no and still get help.)',
    sending: 'Sending…',
    submit: 'Ask us to get in touch',
    netError: 'We could not reach the server. Please check your connection and try again.',
    genericError: 'We could not send that just now. Please try again.',
  },
  hi: {
    doneHeading: 'धन्यवाद — आपका विवरण हमें मिल गया',
    doneBody: 'कोई एक कार्यदिवस के भीतर आपसे संपर्क करेगा। अगर बात ज़रूरी है, तो हमें यहाँ ईमेल कीजिए',
    doneBodyEnd: 'और हम उसे प्राथमिकता देंगे।',
    defaultHeading: 'क्या आप चाहेंगे कि आगे का काम हम सँभालें?',
    defaultBlurb:
      'फ़ोन नंबर या ईमेल छोड़ दीजिए और हम आपको बताएँगे कि आगे क्या होता है। कोई बाध्यता नहीं, '
      + 'और बातचीत का कोई शुल्क नहीं।',
    name: 'आपका नाम',
    phone: 'मोबाइल नंबर',
    email: 'ईमेल पता',
    eitherIsEnough: 'इनमें से कोई एक काफ़ी है।',
    message: 'कुछ और जो हमें पहले बताना चाहें (वैकल्पिक)',
    consent:
      'हाँ, मेरे मामले के बारे में मुझसे संपर्क कीजिए। मैं समझता/समझती हूँ कि मेरा विवरण सुरक्षित रखा जाता है और कहने पर मिटा दिया जाता है।',
    updates:
      'भारत में उत्तराधिकार के नियमों पर कभी-कभार जानकारी भी भेजिए। (वैकल्पिक — मना करने पर भी मदद मिलेगी।)',
    sending: 'भेजा जा रहा है…',
    submit: 'हमसे संपर्क करने को कहिए',
    netError: 'हम सर्वर तक नहीं पहुँच सके। कृपया अपना कनेक्शन जाँचकर दोबारा कोशिश कीजिए।',
    genericError: 'हम इसे अभी भेज नहीं सके। कृपया दोबारा कोशिश कीजिए।',
  },
} as const;

export function LeadForm({ source, caseSummary, heading, blurb, locale = 'en' }: {
  source: LeadSource;
  caseSummary?: Record<string, unknown>;
  heading?: string;
  blurb?: string;
  locale?: 'en' | 'hi';
}) {
  const c = COPY[locale];
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
      setError(body.error ?? c.genericError);
      setState('idle');
    } catch {
      setError(c.netError);
      setState('idle');
    }
  }

  if (state === 'done') {
    return (
      <div className="card">
        <h2>{c.doneHeading}</h2>
        <p style={{ margin: 0 }}>
          {c.doneBody}{' '}
          <a href={`mailto:${SITE.email}`}>{SITE.email}</a> {c.doneBodyEnd}
        </p>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{heading ?? c.defaultHeading}</h2>
      <p className="sub">
        {blurb ?? c.defaultBlurb}
      </p>

      <div className="field">
        <label htmlFor="lead-name">{c.name}</label>
        <input id="lead-name" type="text" value={name} autoComplete="name"
          onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="lead-phone">{c.phone}</label>
          <input id="lead-phone" type="tel" inputMode="tel" value={phone}
            autoComplete="tel" placeholder="98765 43210"
            onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="lead-email">{c.email}</label>
          <input id="lead-email" type="email" value={email} autoComplete="email"
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <p className="hint" style={{ marginTop: '-0.6rem' }}>{c.eitherIsEnough}</p>

      <div className="field">
        <label htmlFor="lead-message">{c.message}</label>
        <textarea id="lead-message" rows={3} value={message}
          onChange={(e) => setMessage(e.target.value)} />
      </div>

      {/* Two separate consents. Never one checkbox covering both purposes. */}
      <div className="field">
        <label className="check">
          <input type="checkbox" checked={consent} required
            onChange={(e) => setConsent(e.target.checked)} />
          <span>{c.consent}</span>
        </label>
      </div>
      <div className="field">
        <label className="check">
          <input type="checkbox" checked={updates}
            onChange={(e) => setUpdates(e.target.checked)} />
          <span>{c.updates}</span>
        </label>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      <button className="btn" type="submit" disabled={state === 'sending' || !consent}>
        {state === 'sending' ? c.sending : c.submit}
      </button>
    </form>
  );
}
