'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Sign-in by email one-time code.
 *
 * No passwords: nothing to breach, nothing to reuse, no reset flow to attack.
 * A one-time code to an address the person already controls is enough for the
 * threat model, and it is one less thing a grieving family has to remember.
 */

const CONSENT_VERSION = '2026-08-22';

function SignInForm() {
  const next = useSearchParams().get('next') ?? '/cases';
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          // Recorded against the profile on first sign-in so we can prove which
          // version of the notice was agreed to, as DPDP requires.
          data: { consent_version: CONSENT_VERSION },
        },
      });

      if (error) {
        setState('error');
        setMessage('We could not send the code. Please check the address and try again.');
        return;
      }

      setState('sent');
    } catch {
      // A network failure rejects rather than returning an error, and without
      // this the button would sit on "Sending…" forever.
      setState('error');
      setMessage('We could not reach the server. Please check your connection and try again.');
    }
  }

  if (state === 'sent') {
    return (
      <>
        <h1>Check your email</h1>
        <p>
          We have sent a sign-in link to <strong>{email}</strong>. It expires in an hour.
        </p>
        <p className="hint">
          If it has not arrived in a few minutes, look in your spam folder. You can
          close this page &mdash; the link works from any device.
        </p>
      </>
    );
  }

  return (
    <>
      <h1>Sign in</h1>
      <p>
        We will email you a link. There is no password to create or remember.
      </p>

      <form onSubmit={send} className="card">
        <div className="field">
          <label htmlFor="email">Your email address</label>
          <input
            id="email" type="email" required autoComplete="email"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="field">
          <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontWeight: 400 }}>
            <input
              type="checkbox" required checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ marginTop: '0.35rem' }}
            />
            <span>
              I agree that Mera Hissa may collect and use the details and documents I
              provide, for the sole purpose of preparing my claim documents. I understand
              they are stored encrypted, deleted 90 days after my case closes, never used
              to train any AI system, and that I can ask for deletion at any time.
            </span>
          </label>
        </div>

        {state === 'error' && <p className="error" role="alert">{message}</p>}

        <button className="primary" type="submit" disabled={state === 'sending' || !consent}>
          {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>

      <p className="hint">
        Consent notice version {CONSENT_VERSION}. We record which version you agreed to.
      </p>
    </>
  );
}

export default function SignIn() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <SignInForm />
    </Suspense>
  );
}
