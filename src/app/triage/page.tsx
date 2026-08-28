'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requirementsFor, type AssetFacts } from '@/lib/requirements';
import { computeShares, fractionToString, type Heir } from '@/lib/succession';
import { ASSET_KINDS, REGIMES, RELATIONSHIPS } from '@/lib/validation';

/**
 * Free triage.
 *
 * Runs ENTIRELY IN THE BROWSER. Nothing is submitted, nothing is stored, no
 * account is required. That is possible because triage deliberately collects
 * no identifying information — only the shape of the case: which regime,
 * which asset kinds, how many heirs of what relationship.
 *
 * It reuses the exact same succession and requirements engines the paid pack
 * uses, so the free answer and the paid answer can never disagree.
 */

const ASSET_LABELS: Record<string, string> = {
  bank_deposit: 'Bank account or fixed deposit',
  demat_shares: 'Shares in a demat account',
  iepf_shares: 'Old shares transferred to the IEPF',
  mutual_fund: 'Mutual funds',
  insurance_policy: 'Life insurance policy',
  epf: 'Provident fund (EPF)',
  ppf: 'PPF account',
  nps: 'National Pension System',
  post_office: 'Post office savings',
  safe_deposit: 'Bank locker',
  other: 'Something else',
};

const REGIME_LABELS: Record<string, string> = {
  hindu: 'Hindu, Sikh, Jain or Buddhist',
  muslim_sunni: 'Muslim (Sunni)',
  muslim_shia: 'Muslim (Shia)',
  christian: 'Christian',
  parsi: 'Parsi',
  testate: 'There is a will',
  unknown: 'Not sure',
};

const REL_LABELS: Record<string, string> = {
  spouse: 'Wife or husband', son: 'Son', daughter: 'Daughter',
  mother: 'Mother', father: 'Father', brother: 'Brother', sister: 'Sister',
  grandson: 'Grandson', granddaughter: 'Granddaughter', other: 'Someone else',
};

interface HeirRow { id: string; relationship: string }

export default function Triage() {
  const [step, setStep] = useState(0);
  const [regime, setRegime] = useState<string>('');
  const [wasFemale, setWasFemale] = useState(false);
  const [heirs, setHeirs] = useState<HeirRow[]>([{ id: 'h1', relationship: 'spouse' }]);
  const [kinds, setKinds] = useState<string[]>([]);
  const [nomination, setNomination] = useState<string>('');

  const canAdvance =
    (step === 0 && regime !== '') ||
    (step === 1 && heirs.length > 0) ||
    (step === 2 && kinds.length > 0) ||
    (step === 3 && nomination !== '');

  return (
    <>
      <h1>What does your case need?</h1>
      <p>
        Six questions. Nothing you enter here leaves your device. This page sends nothing to us,
        and we never ask for a name.
      </p>

      <p className="visually-hidden" role="status">Step {step + 1} of 5</p>
      <ol className="steps" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <li key={i} data-done={String(i <= step)} />)}
      </ol>

      <div className="card">
        {step === 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend><h2>Which community&rsquo;s succession law applies?</h2></legend>
            <p className="hint" style={{ marginBottom: '1rem' }}>
              In India this follows the community of the person who has died, unless they
              left a valid will.
            </p>
            <div className="choice">
              {REGIMES.map((r) => (
                <label key={r}>
                  <input type="radio" name="regime" value={r}
                    checked={regime === r} onChange={() => setRegime(r)} />
                  {REGIME_LABELS[r]}
                </label>
              ))}
            </div>
            {regime === 'hindu' && (
              <div className="field" style={{ marginTop: '1.25rem' }}>
                <label>
                  <input type="checkbox" checked={wasFemale}
                    onChange={(e) => setWasFemale(e.target.checked)} />
                  {' '}This was a woman
                </label>
                <span className="hint">
                  The Hindu Succession Act uses different rules for women, so this changes the answer.
                </span>
              </div>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <>
            <h2>Who is in the family?</h2>
            <p className="hint" style={{ marginBottom: '1rem' }}>
              Add each surviving close relative. No names here &mdash; just how they were related.
            </p>
            {heirs.map((h, i) => (
              <div className="field" key={h.id}>
                <label htmlFor={`rel-${h.id}`}>Relative {i + 1}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select id={`rel-${h.id}`} value={h.relationship}
                    onChange={(e) => setHeirs(heirs.map((x) =>
                      x.id === h.id ? { ...x, relationship: e.target.value } : x))}>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{REL_LABELS[r]}</option>)}
                  </select>
                  {heirs.length > 1 && (
                    <button type="button" className="quiet"
                      onClick={() => setHeirs(heirs.filter((x) => x.id !== h.id))}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="quiet"
              onClick={() => setHeirs([...heirs, { id: `h${Date.now()}`, relationship: 'son' }])}>
              Add another relative
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>What did they hold?</h2>
            <p className="hint" style={{ marginBottom: '1rem' }}>Select everything that applies.</p>
            <div className="choice">
              {ASSET_KINDS.map((k) => (
                <label key={k}>
                  <input type="checkbox" checked={kinds.includes(k)}
                    onChange={(e) => setKinds(e.target.checked
                      ? [...kinds, k]
                      : kinds.filter((x) => x !== k))} />
                  {ASSET_LABELS[k]}
                </label>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2>Was a nominee registered?</h2>
            <p className="hint" style={{ marginBottom: '1rem' }}>
              A registered nominee makes bank and fund claims considerably simpler.
              If you are not sure, say so &mdash; we will assume there was none.
            </p>
            <div className="choice">
              {[['yes', 'Yes, on most accounts'], ['no', 'No'], ['unsure', 'Not sure']].map(
                ([v, label]) => (
                  <label key={v}>
                    <input type="radio" name="nom" value={v}
                      checked={nomination === v} onChange={() => setNomination(v!)} />
                    {label}
                  </label>
                ),
              )}
            </div>
          </>
        )}

        {step === 4 && (
          <Summary regime={regime} wasFemale={wasFemale} heirs={heirs}
            kinds={kinds} nomination={nomination} />
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {step > 0 && (
          <button type="button" className="quiet" onClick={() => setStep(step - 1)}>Back</button>
        )}
        {step < 4 && (
          <button type="button" className="primary" disabled={!canAdvance}
            onClick={() => setStep(step + 1)}>
            Continue
          </button>
        )}
      </div>
    </>
  );
}

function Summary({ regime, wasFemale, heirs, kinds, nomination }: {
  regime: string; wasFemale: boolean; heirs: HeirRow[];
  kinds: string[]; nomination: string;
}) {
  const shareResult = computeShares(
    regime as Parameters<typeof computeShares>[0],
    heirs.map((h) => ({
      id: h.id, relationship: h.relationship as Heir['relationship'], isClaimant: true,
    })),
    { deceasedWasFemale: wasFemale },
  );

  const assets: AssetFacts[] = kinds.map((k, i) => ({
    id: `a${i}`,
    kind: k as AssetFacts['kind'],
    valueBand: 'unknown',
    hasNomination: nomination === 'yes' ? true : nomination === 'no' ? false : null,
  }));

  const reqs = assets.map((a) => requirementsFor(a));
  const needsCourt = reqs.some((r) =>
    r.requirements.some((d) => d.code === 'succession_certificate' && d.mandatory));
  const unsupported = reqs.filter((r) => r.unsupported);

  // Deduplicate: families care about the document list, not per-asset repeats.
  const allDocs = new Map<string, string>();
  for (const r of reqs) for (const d of r.requirements) allDocs.set(d.code, d.label);

  return (
    <>
      <h2>Here is what your case involves</h2>

      {shareResult.requiresAdvocate ? (
        <div className="notice warn">
          <strong>Your case needs a lawyer, not just paperwork.</strong>
          <p style={{ margin: '0.5rem 0 0' }}>{shareResult.advocateReason}</p>
          <p style={{ margin: '0.5rem 0 0' }}>
            We would rather tell you now than take your money first. We can introduce
            you to an advocate who handles these.
          </p>
        </div>
      ) : (
        <>
          <p><strong>Shares, under the law that applies to you:</strong></p>
          <ul>
            {shareResult.shares.map((s) => {
              const rel = heirs.find((h) => h.id === s.heirId)?.relationship ?? '';
              return (
                <li key={s.heirId}>
                  {REL_LABELS[rel] ?? rel}: <strong>{fractionToString(s.share)}</strong>
                  <span className="hint"> &mdash; {s.basis}</span>
                </li>
              );
            })}
          </ul>
          {shareResult.notes.map((n) => (
            <p key={n} className="hint" style={{ marginTop: '0.75rem' }}>{n}</p>
          ))}
        </>
      )}

      {allDocs.size > 0 && (
        <>
          <p style={{ marginTop: '1.5rem' }}><strong>Documents you will need:</strong></p>
          <ul>{[...allDocs.values()].map((label) => <li key={label}>{label}</li>)}</ul>
        </>
      )}

      {needsCourt && (
        <div className="notice warn">
          <strong>At least one asset will need a succession certificate.</strong>
          <p style={{ margin: '0.5rem 0 0' }}>
            That is a court application under the Indian Succession Act and typically
            takes six months or more. We prepare everything around it, but an advocate
            must file it.
          </p>
        </div>
      )}

      {unsupported.length > 0 && (
        <div className="notice">
          Some of what you listed (PPF, NPS or a locker) we handle manually rather than
          automatically. We will confirm the steps for those with you directly.
        </div>
      )}

      <div className="notice">
        <strong>Nothing here has been sent to us.</strong> This page ran entirely in your
        browser. If you would like us to prepare these documents, the next step creates
        an account and asks for the details we actually need.
      </div>

      <Link href="/intake" className="primary">Prepare these documents for me</Link>
    </>
  );
}
