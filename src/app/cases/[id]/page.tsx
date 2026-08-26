import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { computeShares, fractionToString, type Heir } from '@/lib/succession';
import { tierFor, formatRupees } from '@/lib/payments';
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
          <a href={`/api/packs/${approved.id}/download`}>
            <button className="primary" type="button">Download the pack</button>
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
