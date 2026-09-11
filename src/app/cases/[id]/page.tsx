import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { computeShares, fractionToString, type Heir } from '@/lib/succession';
import { tierFor, formatRupees } from '@/lib/payments';
import {
  requirementsFor, DOCUMENT_SOURCE,
  type AssetFacts, type Requirement,
} from '@/lib/requirements';
import { statusLabel } from '@/lib/statusLabel';
import { CaseActions } from './actions';

export const dynamic = 'force-dynamic';

export default async function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const [{ data: kase }, { data: heirs }, { data: assets }, { data: packs }] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase.from('heirs').select('*').eq('case_id', id),
    supabase.from('assets').select('*').eq('case_id', id),
    supabase.from('packs').select('id, version, status, created_at')
      .eq('case_id', id).order('version', { ascending: false }),
  ]);

  // RLS returns nothing for a case that is not theirs, so this is both the
  // "does not exist" and the "not yours" answer — indistinguishable by design.
  if (!kase) notFound();

  const shares = computeShares(
    kase.regime as Parameters<typeof computeShares>[0],
    (heirs ?? []).map((h): Heir => ({
      id: h.id as string,
      relationship: h.relationship as Heir['relationship'],
      isClaimant: Boolean(h.is_claimant),
    })),
    { deceasedWasFemale: Boolean(kase.deceased_was_female) },
  );

  const tier = tierFor((assets ?? []).length, Boolean(kase.advocate_referral_needed));

  /**
   * The document list, resolved per holding by the SAME engine that drives
   * generation. Showing it before payment is the point: the landing page
   * promises you see the answer before you pay, and until now this screen asked
   * for money without ever naming what the money buys.
   *
   * Deriving it here rather than storing a copy means the list on screen cannot
   * drift from the list actually produced — if a rule changes, both move.
   */
  const perAsset = (assets ?? []).map((a) => {
    const result = requirementsFor({
      id: a.id as string,
      kind: a.kind as AssetFacts['kind'],
      valueBand: a.value_band as AssetFacts['valueBand'],
      hasNomination: a.has_nomination as boolean | null,
    });
    const split = (side: 'you' | 'us') =>
      result.requirements.filter((r: Requirement) => DOCUMENT_SOURCE[r.code] === side);
    return {
      institution: a.institution as string,
      mask: a.account_ref_mask as string | null,
      result,
      byUs: split('us'),
      byYou: split('you'),
    };
  });

  // Counted across holdings, de-duplicated: the death certificate is one
  // certificate whether it is needed by one institution or six.
  const uniq = (side: 'you' | 'us') =>
    new Set(perAsset.flatMap((p) => (side === 'us' ? p.byUs : p.byYou)).map((r) => r.code)).size;
  const weDraft = uniq('us');
  const youBring = uniq('you');
  // Two different reasons a case gets held, and they need different words: a
  // rule past its review date is ours to re-verify, an asset kind with no rule
  // at all is ours to prepare by hand. Saying "past its review date" about a
  // PPF account would be plainly untrue.
  const anyStale = perAsset.some((p) => p.result.stale);
  const anyUnsupported = perAsset.some((p) => p.result.unsupported);
  const approved = (packs ?? []).find((p) => p.status === 'approved');
  const heirName = new Map((heirs ?? []).map((h) => [h.id as string, h.full_name as string]));

  return (
    <>
      <h1>{kase.deceased_name as string}</h1>
      <p className="hint">
        {statusLabel(kase.status as string)}
        {kase.deceased_dod ? ` · died ${kase.deceased_dod as string}` : ''}
      </p>

      {kase.advocate_referral_needed ? (
        <div className="notice warn">
          <strong>Part of this case needs an advocate.</strong>
          <p style={{ margin: '0.5rem 0 0' }}>{kase.referral_reason as string}</p>
          <p style={{ margin: '0.5rem 0 0' }}>
            We will still prepare everything around it, and we can introduce you to
            someone who handles these.
          </p>
        </div>
      ) : null}

      {approved ? (
        <div className="card">
          <h2>Your documents are ready</h2>
          <p>
            A person at Mera Hissa has checked this pack. Print the affidavit and indemnity
            bond on stamp paper of the value your state requires.
          </p>
          <a className="primary" href={`/api/packs/${approved.id}/download`}>
            Download the pack
          </a>
        </div>
      ) : null}

      {shares.computed && shares.shares.length > 0 ? (
        <div className="card">
          <h2>Who inherits what</h2>
          <p className="hint">
            Set by statute, not by us. These are the shares the law gives.
          </p>
          <ul>
            {shares.shares.map((s) => (
              <li key={s.heirId}>
                {heirName.get(s.heirId) ?? s.heirId}: <strong>{fractionToString(s.share)}</strong>
                <br />
                <span className="hint">{s.basis}</span>
              </li>
            ))}
          </ul>
          {shares.notes.length > 0 && (
            <>
              <p style={{ marginTop: '1rem' }}><strong>Worth checking</strong></p>
              <ul>{shares.notes.map((n) => <li key={n} className="hint">{n}</li>)}</ul>
            </>
          )}
        </div>
      ) : null}

      <div className="card">
        <h2>Holdings</h2>
        <ul>
          {(assets ?? []).map((a) => (
            <li key={a.id as string}>
              {a.institution as string}
              {a.account_ref_mask ? ` · ${a.account_ref_mask as string}` : ''}
              {a.has_nomination === false ? ' · no nominee' : ''}
            </li>
          ))}
        </ul>
      </div>

      {perAsset.length > 0 ? (
        <div className="card">
          <h2>What this claim needs</h2>
          <p className="hint">
            Worked out from the law and each institution&rsquo;s own rules, before you pay
            anything. {weDraft > 0 ? (
              <>We draft and fill <strong>{weDraft}</strong> of these for you; the{' '}
              <strong>{youBring}</strong> marked <em>you obtain</em> are certificates only
              you can get.</>
            ) : null}
          </p>

          <ul className="doc-list">
            {perAsset.map((p) => (
              <li key={p.institution + (p.mask ?? '')}>
                <h3>
                  {p.institution}
                  {p.mask ? <span className="hint"> &middot; {p.mask}</span> : null}
                </h3>

                {p.result.unsupported ? (
                  <p className="hint">
                    We prepare this one by hand rather than automatically, and will confirm
                    the exact steps with you directly.
                  </p>
                ) : (
                  <ul className="docs">
                    {p.result.requirements.map((r) => (
                      <li key={r.code} data-source={DOCUMENT_SOURCE[r.code]}>
                        <span className="doc-label">{r.label}</span>
                        <span className="doc-tags">
                          {!r.mandatory ? <span className="chip">If asked</span> : null}
                          <span className="chip" data-source={DOCUMENT_SOURCE[r.code]}>
                            {DOCUMENT_SOURCE[r.code] === 'us' ? 'We prepare' : 'You obtain'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {p.result.notes.map((note) => (
                  <p key={note} className="hint">{note}</p>
                ))}
              </li>
            ))}
          </ul>

          <p className="hint" style={{ marginBottom: 0 }}>
            {anyStale
              ? 'At least one rule here is past its review date, so this case is held for '
                + 'a person to re-verify before anything is generated. '
              : null}
            {anyUnsupported
              ? 'At least one holding has no automatic rule set and is prepared by hand. '
              : null}
            The filled forms, affidavits and covering letters themselves arrive after
            payment, checked by a person first.
          </p>
        </div>
      ) : null}

      <CaseActions
        caseId={id}
        status={kase.status as string}
        tierLabel={tier.label}
        priceLabel={formatRupees(tier.amountPaise)}
      />

      <div className="card">
        <h2>Delete this case</h2>
        <p className="hint">
          This removes everything &mdash; the details above, every document you uploaded,
          and any prepared pack. It cannot be undone, and we cannot recover it for you.
        </p>
        <CaseActions caseId={id} status={kase.status as string} deleteOnly />
      </div>
    </>
  );
}
