'use client';

import { useState } from 'react';
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
  key: string; kind: string; institution: string; accountLast4: string;
  valueBand: string; hasNomination: string; isJoint: boolean;
}

const newHeir = (): HeirRow => ({
  key: crypto.randomUUID(), fullName: '', relationship: 'spouse',
  isMinor: false, isClaimant: true,
});
const newAsset = (): AssetRow => ({
  key: crypto.randomUUID(), kind: 'bank_deposit', institution: '',
  accountLast4: '', valueBand: 'unknown', hasNomination: 'unsure', isJoint: false,
});

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

  async function submit() {
    setSubmitting(true);
    setErrors({});

    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deceasedName,
        deceasedDateOfDeath: dod || undefined,
        deceasedWasFemale: wasFemale,
        regime, hasWill, willIsRegistered: null,
        heirs: heirs.map(({ key: _key, ...h }) => h),
        assets: assets.map(({ key: _key, accountLast4, hasNomination, ...a }) => ({
          ...a,
          accountLast4: accountLast4 || undefined,
          hasNomination: hasNomination === 'unsure' ? null : hasNomination === 'yes',
        })),
      }),
    });

    if (res.status === 422) {
      const body = await res.json();
      setErrors(body.errors ?? {});
      setSubmitting(false);
      setStep(0);   // send them back to the top so they can find the problem
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

      <ol className="steps" aria-label="Progress">
        {[0, 1, 2, 3].map((i) => <li key={i} data-done={String(i <= step)} />)}
      </ol>

      {errors._form && <div className="notice warn">{errors._form}</div>}

      <div className="card">
        {step === 0 && (
          <>
            <h2>About the person you have lost</h2>
            <div className="field">
              <label htmlFor="dn">Their full name, spelled as it appears on their documents</label>
              <input id="dn" type="text" value={deceasedName}
                onChange={(e) => setDeceasedName(e.target.value)} />
              <span className="hint">
                Spelling matters here &mdash; banks match this against their records.
              </span>
              {errors.deceasedName && <span className="error">{errors.deceasedName}</span>}
            </div>

            <div className="field">
              <label htmlFor="dod">Date they passed away</label>
              <input id="dod" type="date" value={dod} max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDod(e.target.value)} />
              {errors.deceasedDateOfDeath && (
                <span className="error">{errors.deceasedDateOfDeath}</span>
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
                    onChange={(e) => setHeirs(heirs.map((x) =>
                      x.key === h.key ? { ...x, fullName: e.target.value } : x))} />
                  {errors[`heirs.${i}.fullName`] && (
                    <span className="error">{errors[`heirs.${i}.fullName`]}</span>
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
              One entry per account or holding. We only ever ask for the last four
              digits &mdash; the institution already knows the full number.
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
                    onChange={(e) => setAssets(assets.map((x) =>
                      x.key === a.key ? { ...x, institution: e.target.value } : x))} />
                  {errors[`assets.${i}.institution`] && (
                    <span className="error">{errors[`assets.${i}.institution`]}</span>
                  )}
                </div>

                <div className="field">
                  <label htmlFor={`al-${a.key}`}>Last four digits (optional)</label>
                  <input id={`al-${a.key}`} type="text" inputMode="numeric"
                    maxLength={4} value={a.accountLast4} style={{ maxWidth: '8rem' }}
                    onChange={(e) => setAssets(assets.map((x) =>
                      x.key === a.key
                        ? { ...x, accountLast4: e.target.value.replace(/\D/g, '') }
                        : x))} />
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
                  {a.accountLast4 && ` ending ${a.accountLast4}`}
                  {' — '}{BAND_LABELS[a.valueBand]}
                </li>
              ))}
            </ul>

            <div className="notice">
              We will work out what each institution needs and prepare the documents.
              A person at Virasat checks every pack before it reaches you.
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
