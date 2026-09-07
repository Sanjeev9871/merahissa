'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASSET_KINDS, REGIMES, RELATIONSHIPS, VALUE_BANDS } from '@/lib/validation';

/**
 * Intake wizard.
 *
 * Four steps, each one screen, with progress saved in component state rather
 * than posted step by step. Nothing reaches the server until the family has
 * seen the whole thing and pressed submit once — a partially-saved case with
 * three of five heirs would generate a confidently wrong share table.
 */

const REGIME_LABELS: Record<string, string> = {
  hindu: 'Hindu, Sikh, Jain or Buddhist', muslim_sunni: 'Muslim (Sunni)',
  muslim_shia: 'Muslim (Shia)', christian: 'Christian', parsi: 'Parsi',
  testate: 'There is a will', unknown: 'Not sure',
};

const REL_LABELS: Record<string, string> = {
  spouse: 'Wife or husband', son: 'Son', daughter: 'Daughter', mother: 'Mother',
  father: 'Father', brother: 'Brother', sister: 'Sister',
  grandson: 'Grandson', granddaughter: 'Granddaughter', other: 'Someone else',
};

const ASSET_LABELS: Record<string, string> = {
  bank_deposit: 'Bank account or FD', demat_shares: 'Shares (demat)',
  iepf_shares: 'Shares transferred to IEPF', mutual_fund: 'Mutual funds',
  insurance_policy: 'Life insurance', epf: 'Provident fund (EPF)',
  ppf: 'PPF', nps: 'NPS', post_office: 'Post office savings',
  safe_deposit: 'Bank locker', other: 'Other',
};

const BAND_LABELS: Record<string, string> = {
  under_1L: 'Under ₹1 lakh', '1L_to_5L': '₹1–5 lakh', '5L_to_10L': '₹5–10 lakh',
  over_10L: 'Over ₹10 lakh', unknown: 'I do not know',
};

interface HeirRow {
  key: string; fullName: string; relationship: string; isMinor: boolean; isClaimant: boolean;
}
interface AssetRow {
  key: string; kind: string; institution: string; accountRef: string;
  valueBand: string; hasNomination: string; isJoint: boolean;
}

// A plain counter, not crypto.randomUUID(): these keys never leave the client,
// and crypto.randomUUID is undefined in a non-secure context (opening the app
// over plain HTTP on a LAN IP to test on a phone), where it would throw during
// render and take the whole page down.
let rowSeq = 0;
const uid = () => `row-${rowSeq++}`;

const newHeir = (): HeirRow => ({
  key: uid(), fullName: '', relationship: 'spouse',
  isMinor: false, isClaimant: true,
});
const newAsset = (): AssetRow => ({
  key: uid(), kind: 'bank_deposit', institution: '',
  accountRef: '', valueBand: 'unknown', hasNomination: 'unsure', isJoint: false,
});

/** Which wizard step owns the first field in a set of server error keys. */
function firstErrorStep(keys: string[]): number {
  if (keys.some((k) => k.startsWith('deceased') || k === 'regime')) return 0;
  if (keys.some((k) => k.startsWith('heirs'))) return 1;
  if (keys.some((k) => k.startsWith('assets'))) return 2;
  return 0;
}

export default function Intake() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deceasedName, setDeceasedName] = useState('');
  const [dod, setDod] = useState('');
  const [wasFemale, setWasFemale] = useState(false);
  const [regime, setRegime] = useState('hindu');
  const [hasWill, setHasWill] = useState(false);
  const [heirs, setHeirs] = useState<HeirRow[]>([newHeir()]);
  const [assets, setAssets] = useState<AssetRow[]>([newAsset()]);

  // Today's date for the date-of-death cap, computed on the client in the
  // user's own timezone. Doing it inline as new Date().toISOString() ran on
  // both the server and the client (a hydration mismatch across UTC midnight)
  // and used UTC, so between 00:00 and 05:30 IST it refused today's date.
  const [maxDod, setMaxDod] = useState('');
  useEffect(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    setMaxDod(local.toISOString().slice(0, 10));
  }, []);

  async function submit() {
    setSubmitting(true);
    setErrors({});

    let res: Response;
    try {
      res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          deceasedName,
          deceasedDateOfDeath: dod || undefined,
          deceasedWasFemale: wasFemale,
          regime, hasWill, willIsRegistered: null,
          heirs: heirs.map(({ key: _key, ...h }) => h),
          assets: assets.map(({ key: _key, accountRef, hasNomination, ...a }) => ({
            ...a,
            accountRef: accountRef.trim() || undefined,
            hasNomination: hasNomination === 'unsure' ? null : hasNomination === 'yes',
          })),
        }),
      });
    } catch {
      setErrors({ _form: 'We could not reach the server. Please check your connection and try again.' });
      setSubmitting(false);
      return;
    }

    if (res.status === 422) {
      const body = await res.json().catch(() => ({}));
      const fieldErrors: Record<string, string> = body.errors ?? {};
      // Take the user to the step that actually owns the first problem and tell
      // them something is wrong, rather than dropping them on step 1 with the
      // heir/asset error messages rendered on a step that never shows them.
      setErrors({
        ...fieldErrors,
        _form: 'Some details need fixing. We have taken you to the first one.',
      });
      setSubmitting(false);
      setStep(firstErrorStep(Object.keys(fieldErrors)));
      return;
    }

    if (!res.ok) {
      setErrors({ _form: 'We could not save your case. Please try again in a moment.' });
      setSubmitting(false);
      return;
    }

    const { caseId } = await res.json();
    router.push(`/cases/${caseId}`);
  }

  return (
    <>
      <h1>Tell us about the estate</h1>
      <p>Four short steps. You can go back and change anything before you submit.</p>

      <p className="visually-hidden" role="status">Step {step + 1} of 4</p>
      <ol className="steps" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => <li key={i} data-done={String(i <= step)} />)}
      </ol>

      {errors._form && <div className="notice warn" role="alert">{errors._form}</div>}

      <div className="card">
        {step === 0 && (
          <>
            <h2>About the person you have lost</h2>
            <div className="field">
              <label htmlFor="dn">Their full name, spelled as it appears on their documents</label>
              <input id="dn" type="text" value={deceasedName}
                aria-invalid={Boolean(errors.deceasedName)}
                aria-describedby={errors.deceasedName ? 'dn-error' : undefined}
                onChange={(e) => setDeceasedName(e.target.value)} />
              <span className="hint">
                Spelling matters here &mdash; banks match this against their records.
              </span>
              {errors.deceasedName && <span className="error" id="dn-error">{errors.deceasedName}</span>}
            </div>

            <div className="field">
              <label htmlFor="dod">Date they passed away</label>
              <input id="dod" type="date" value={dod} max={maxDod || undefined}
                aria-invalid={Boolean(errors.deceasedDateOfDeath)}
                aria-describedby={errors.deceasedDateOfDeath ? 'dod-error' : undefined}
                onChange={(e) => setDod(e.target.value)} />
              {errors.deceasedDateOfDeath && (
                <span className="error" id="dod-error">{errors.deceasedDateOfDeath}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="regime">Which community&rsquo;s succession law applies?</label>
              <select id="regime" value={regime} onChange={(e) => setRegime(e.target.value)}>
                {REGIMES.map((r) => <option key={r} value={r}>{REGIME_LABELS[r]}</option>)}
              </select>
            </div>

            {regime === 'hindu' && (
              <div className="field">
                <label style={{ fontWeight: 400 }}>
                  <input type="checkbox" checked={wasFemale}
                    onChange={(e) => setWasFemale(e.target.checked)} />
                  {' '}This was a woman
                </label>
                <span className="hint">
                  The Hindu Succession Act sets out different rules for women.
                </span>
              </div>
            )}

            <div className="field">
              <label style={{ fontWeight: 400 }}>
                <input type="checkbox" checked={hasWill}
                  onChange={(e) => setHasWill(e.target.checked)} />
                {' '}They left a will
              </label>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2>Their family</h2>
            <p className="hint" style={{ marginBottom: '1.25rem' }}>
              Include everyone still living, even those not claiming a share. Leaving
              someone out is the commonest reason a claim comes back rejected.
            </p>

            {heirs.map((h, i) => (
              <div key={h.key} className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="field">
                  <label htmlFor={`hn-${h.key}`}>Full name</label>
                  <input id={`hn-${h.key}`} type="text" value={h.fullName}
                    aria-invalid={Boolean(errors[`heirs.${i}.fullName`])}
                    aria-describedby={errors[`heirs.${i}.fullName`] ? `hn-${h.key}-error` : undefined}
                    onChange={(e) => setHeirs(heirs.map((x) =>
                      x.key === h.key ? { ...x, fullName: e.target.value } : x))} />
                  {errors[`heirs.${i}.fullName`] && (
                    <span className="error" id={`hn-${h.key}-error`}>{errors[`heirs.${i}.fullName`]}</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={`hr-${h.key}`}>How they were related</label>
                  <select id={`hr-${h.key}`} value={h.relationship}
                    onChange={(e) => setHeirs(heirs.map((x) =>
                      x.key === h.key ? { ...x, relationship: e.target.value } : x))}>
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>{REL_LABELS[r]}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <label style={{ fontWeight: 400, fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={h.isMinor}
                      onChange={(e) => setHeirs(heirs.map((x) =>
                        x.key === h.key ? { ...x, isMinor: e.target.checked } : x))} />
                    {' '}Under 18
                  </label>
                  <label style={{ fontWeight: 400, fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={h.isClaimant}
                      onChange={(e) => setHeirs(heirs.map((x) =>
                        x.key === h.key ? { ...x, isClaimant: e.target.checked } : x))} />
                    {' '}Claiming a share
                  </label>
                  {heirs.length > 1 && (
                    <button type="button" className="quiet" style={{ marginLeft: 'auto' }}
                      onClick={() => setHeirs(heirs.filter((x) => x.key !== h.key))}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" className="quiet"
              onClick={() => setHeirs([...heirs, newHeir()])}>
              Add another person
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>What they held</h2>
            <p className="hint" style={{ marginBottom: '1.25rem' }}>
              One entry per account or holding. The account number goes on the claim
              form, so we need it in full &mdash; it is stored encrypted, shown back to
              you masked, never sent to any AI system, and deleted with your case.
            </p>

            {assets.map((a, i) => (
              <div key={a.key} className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="field">
                  <label htmlFor={`ak-${a.key}`}>Type</label>
                  <select id={`ak-${a.key}`} value={a.kind}
                    onChange={(e) => setAssets(assets.map((x) =>
                      x.key === a.key ? { ...x, kind: e.target.value } : x))}>
                    {ASSET_KINDS.map((k) => (
                      <option key={k} value={k}>{ASSET_LABELS[k]}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor={`ai-${a.key}`}>Which bank, company or fund?</label>
                  <input id={`ai-${a.key}`} type="text" value={a.institution}
                    placeholder="e.g. State Bank of India"
                    aria-invalid={Boolean(errors[`assets.${i}.institution`])}
                    aria-describedby={errors[`assets.${i}.institution`] ? `ai-${a.key}-error` : undefined}
                    onChange={(e) => setAssets(assets.map((x) =>
                      x.key === a.key ? { ...x, institution: e.target.value } : x))} />
                  {errors[`assets.${i}.institution`] && (
                    <span className="error" id={`ai-${a.key}-error`}>{errors[`assets.${i}.institution`]}</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={`al-${a.key}`}>Account, folio or policy number</label>
                  <input id={`al-${a.key}`} type="text" inputMode="text"
                    autoComplete="off" spellCheck={false}
                    maxLength={32} value={a.accountRef} style={{ maxWidth: '20rem' }}
                    aria-invalid={Boolean(errors[`assets.${i}.accountRef`])}
                    aria-describedby={`al-${a.key}-hint${errors[`assets.${i}.accountRef`] ? ` al-${a.key}-error` : ''}`}
                    onChange={(e) => setAssets(assets.map((x) =>
                      x.key === a.key
                        ? { ...x, accountRef: e.target.value.replace(/[^A-Za-z0-9/-]/g, '') }
                        : x))} />
                  <span className="hint" id={`al-${a.key}-hint`}>
                    In full, as printed on the statement or policy &mdash; the claim form
                    needs it. Stored encrypted and shown back to you masked.
                  </span>
                  {errors[`assets.${i}.accountRef`] && (
                    <span className="error" id={`al-${a.key}-error`}>{errors[`assets.${i}.accountRef`]}</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={`av-${a.key}`}>Roughly how much?</label>
                  <select id={`av-${a.key}`} value={a.valueBand}
                    onChange={(e) => setAssets(assets.map((x) =>
                      x.key === a.key ? { ...x, valueBand: e.target.value } : x))}>
                    {VALUE_BANDS.map((v) => (
                      <option key={v} value={v}>{BAND_LABELS[v]}</option>
                    ))}
                  </select>
                  <span className="hint">
                    A range is enough. It decides which documents the institution asks for.
                  </span>
                </div>

                <div className="field">
                  <label htmlFor={`an-${a.key}`}>Was a nominee registered?</label>
                  <select id={`an-${a.key}`} value={a.hasNomination}
                    onChange={(e) => setAssets(assets.map((x) =>
                      x.key === a.key ? { ...x, hasNomination: e.target.value } : x))}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="unsure">Not sure</option>
                  </select>
                </div>

                {assets.length > 1 && (
                  <button type="button" className="quiet"
                    onClick={() => setAssets(assets.filter((x) => x.key !== a.key))}>
                    Remove this holding
                  </button>
                )}
              </div>
            ))}

            <button type="button" className="quiet"
              onClick={() => setAssets([...assets, newAsset()])}>
              Add another holding
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Check before you submit</h2>
            <p><strong>{deceasedName || '(no name entered)'}</strong>
              {dod && `, died ${dod}`}</p>
            <p className="hint">{REGIME_LABELS[regime]}{hasWill && ' · left a will'}</p>

            <p style={{ marginTop: '1.25rem' }}><strong>Family</strong></p>
            <ul>
              {heirs.map((h) => (
                <li key={h.key}>
                  {h.fullName || '(no name)'} &mdash; {REL_LABELS[h.relationship]}
                  {h.isMinor && ' (under 18)'}
                  {!h.isClaimant && ' — not claiming'}
                </li>
              ))}
            </ul>

            <p style={{ marginTop: '1rem' }}><strong>Holdings</strong></p>
            <ul>
              {assets.map((a) => (
                <li key={a.key}>
                  {ASSET_LABELS[a.kind]} at {a.institution || '(not named)'}
                  {a.accountRef && ` ending ${a.accountRef.slice(-4)}`}
                  {' — '}{BAND_LABELS[a.valueBand]}
                </li>
              ))}
            </ul>

            <div className="notice">
              We will work out what each institution needs and prepare the documents.
              A person at Mera Hissa checks every pack before it reaches you.
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {step > 0 && (
          <button type="button" className="quiet" onClick={() => setStep(step - 1)}>Back</button>
        )}
        {step < 3 ? (
          <button type="button" className="primary" onClick={() => setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <button type="button" className="primary" onClick={submit} disabled={submitting}>
            {submitting ? 'Saving…' : 'Submit and see the price'}
          </button>
        )}
      </div>
    </>
  );
}
