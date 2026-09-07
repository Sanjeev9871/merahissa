'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requirementsFor, type AssetFacts } from '@/lib/requirements';
import { computeShares, fractionToString, type Heir } from '@/lib/succession';
import { ASSET_KINDS, REGIMES, RELATIONSHIPS } from '@/lib/validation';
import {
  TRIAGE_COPY, REL_LABELS_BY_LOCALE, REGIME_LABELS_BY_LOCALE, ASSET_LABELS_BY_LOCALE,
  type TriageLocale,
} from '@/lib/triage-copy';

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

interface HeirRow { id: string; relationship: string }

export default function Triage({ locale = 'en' }: { locale?: TriageLocale }) {
  const t = TRIAGE_COPY[locale];
  const REL_LABELS = REL_LABELS_BY_LOCALE[locale];
  const REGIME_LABELS = REGIME_LABELS_BY_LOCALE[locale];
  const ASSET_LABELS = ASSET_LABELS_BY_LOCALE[locale];
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
      <h1>{t.title}</h1>
      <p>
        {t.intro}
      </p>

      <p className="visually-hidden" role="status">{t.stepOf(step + 1, 5)}</p>
      <ol className="steps" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => <li key={i} data-done={String(i <= step)} />)}
      </ol>

      <div className="card">
        {step === 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend><h2>{t.q0}</h2></legend>
            <p className="hint" style={{ marginBottom: '1rem' }}>
              {t.q0hint}
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
                  {' '}{t.wasFemale}
                </label>
                <span className="hint">
                  {t.wasFemaleHint}
                </span>
              </div>
            )}
          </fieldset>
        )}

        {step === 1 && (
          <>
            <h2>{t.q1}</h2>
            <p className="hint" style={{ marginBottom: '1rem' }}>
              {t.q1hint}
            </p>
            {heirs.map((h, i) => (
              <div className="field" key={h.id}>
                <label htmlFor={`rel-${h.id}`}>{t.relative(i + 1)}</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select id={`rel-${h.id}`} value={h.relationship}
                    onChange={(e) => setHeirs(heirs.map((x) =>
                      x.id === h.id ? { ...x, relationship: e.target.value } : x))}>
                    {RELATIONSHIPS.map((r) => <option key={r} value={r}>{REL_LABELS[r]}</option>)}
                  </select>
                  {heirs.length > 1 && (
                    <button type="button" className="quiet"
                      onClick={() => setHeirs(heirs.filter((x) => x.id !== h.id))}>
                      {t.remove}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="quiet"
              onClick={() => setHeirs([...heirs, { id: `h${Date.now()}`, relationship: 'son' }])}>
              {t.addRelative}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>{t.q2}</h2>
            <p className="hint" style={{ marginBottom: '1rem' }}>{t.q2hint}</p>
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
            <h2>{t.q3}</h2>
            <p className="hint" style={{ marginBottom: '1rem' }}>
              {t.q3hint}
            </p>
            <div className="choice">
              {[['yes', t.nomYes], ['no', t.nomNo], ['unsure', t.nomUnsure]].map(
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
            kinds={kinds} nomination={nomination} locale={locale} />
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {step > 0 && (
          <button type="button" className="quiet" onClick={() => setStep(step - 1)}>{t.back}</button>
        )}
        {step < 4 && (
          <button type="button" className="primary" disabled={!canAdvance}
            onClick={() => setStep(step + 1)}>
            {t.cont}
          </button>
        )}
      </div>
    </>
  );
}

function Summary({ regime, wasFemale, heirs, kinds, nomination, locale }: {
  regime: string; wasFemale: boolean; heirs: HeirRow[];
  kinds: string[]; nomination: string; locale: TriageLocale;
}) {
  const t = TRIAGE_COPY[locale];
  const REL_LABELS = REL_LABELS_BY_LOCALE[locale];
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
      <h2>{t.sumTitle}</h2>

      {shareResult.requiresAdvocate ? (
        <div className="notice warn">
          <strong>{t.advocateTitle}</strong>
          <p style={{ margin: '0.5rem 0 0' }}>{shareResult.advocateReason}</p>
          <p style={{ margin: '0.5rem 0 0' }}>
            {t.advocateBody}
          </p>
        </div>
      ) : (
        <>
          <p><strong>{t.sharesLabel}</strong></p>
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
          <p style={{ marginTop: '1.5rem' }}><strong>{t.docsLabel}</strong></p>
          <ul>{[...allDocs.values()].map((label) => <li key={label}>{label}</li>)}</ul>
        </>
      )}

      {needsCourt && (
        <div className="notice warn">
          <strong>{t.courtTitle}</strong>
          <p style={{ margin: '0.5rem 0 0' }}>
            {t.courtBody}
          </p>
        </div>
      )}

      {unsupported.length > 0 && (
        <div className="notice">
          {t.unsupported}
        </div>
      )}

      <div className="notice">
        <strong>{t.nothingSent}</strong> {t.nothingSentBody}
      </div>

      <Link href={t.intakeHref} className="primary">{t.prepare}</Link>
    </>
  );
}
