import { supabaseAdmin } from '@/lib/supabase/server';
import { ruleSets } from '@/lib/requirements';
import { isDistributed } from '@/lib/ratelimit';
import { ReviewActions } from './actions';

export const dynamic = 'force-dynamic';

type AdminPack = {
  id: string;
  case_id: string;
  version: number;
  status: string;
  model_notes: {
    holdReasons?: string[];
    unresolvedTokens?: string[];
    flags?: string[];
  } | null;
  template_manifest: Array<{
    ruleId: string;
    version: string;
  }> | null;
  created_at: string;
};

/**
 * Admin review queue.
 *
 * Reached only after the middleware admin check AND the `is_admin` column;
 * unauthorised visitors get a 404 rather than a 403, so the route's existence
 * is not confirmed to someone probing.
 *
 * This page is the human in "a person approves every pack". It shows why a
 * pack was held, what rules produced it, and nothing more than the reviewer
 * needs — case data is opened deliberately, not displayed in a list.
 */
export default async function AdminQueue() {
  const db = supabaseAdmin();

  const { data: packs, error: packsError } = await db
    .from('packs')
    .select(
      'id, case_id, version, status, model_notes, template_manifest, created_at'
    )
    .in('status', ['queued', 'generated'])
    .order('created_at', { ascending: true }) as {
      data: AdminPack[] | null;
      error: { message: string } | null;
    };

  const stale = ruleSets().filter(
    (r) => new Date(r.verifyBy) < new Date()
  );

  return (
    <>
      <h1>Review queue</h1>

      {stale.length > 0 && (
        <div className="notice warn">
          <strong>
            {stale.length} rule set
            {stale.length > 1 ? 's are' : ' is'} past review.
          </strong>

          <p style={{ margin: '0.5rem 0 0' }}>
            Cases touching {stale.length > 1 ? 'these' : 'this'} are being held
            automatically. An advocate needs to confirm the current forms,
            then bump <code>verifyBy</code> in <code>requirements.ts</code>.
          </p>

          <ul style={{ margin: '0.5rem 0 0' }}>
            {stale.map((r) => (
              <li key={r.id}>
                <code>{r.id}</code> v{r.version} — due {r.verifyBy}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!isDistributed() && (
        <div className="notice warn">
          <strong>Rate limiting is running in-process.</strong>

          <p style={{ margin: '0.5rem 0 0' }}>
            Upstash is not configured, so limits are per-instance and a
            distributed flood would get a multiple of the intended limit.
            Fine for development; set{' '}
            <code>UPSTASH_REDIS_REST_URL</code> before launch.
          </p>
        </div>
      )}

      {packsError ? (
        <div className="notice warn" role="alert">
          <strong>The review queue could not be loaded.</strong>
          <p style={{ margin: '0.5rem 0 0' }}>
            This is a system error, not an empty queue — packs may be waiting.
            Refresh in a moment; if it persists, check Supabase.
          </p>
        </div>
      ) : !packs || packs.length === 0 ? (
        <p>Nothing waiting.</p>
      ) : (
        packs.map((p) => {
          const notes = p.model_notes ?? {};
          const manifest = p.template_manifest ?? [];
          const held = p.status === 'queued';

          return (
            <div className="card" key={p.id}>
              <h2>
                Case {String(p.case_id).slice(0, 8).toUpperCase()} · v
                {p.version}
              </h2>

              <p className="hint" style={{ marginTop: 0 }}>
                {held
                  ? 'HELD — needs work before it can be approved'
                  : 'Generated — ready to review'}
                {' · '}
                {new Date(p.created_at).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short',
                })}
                {' IST'}
              </p>

              {notes.holdReasons && notes.holdReasons.length > 0 && (
                <>
                  <p>
                    <strong>Why it is held</strong>
                  </p>

                  <ul>
                    {notes.holdReasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </>
              )}

              {notes.unresolvedTokens &&
                notes.unresolvedTokens.length > 0 && (
                  <div className="notice warn">
                    <strong>
                      The model invented placeholders that match nobody in
                      this case:
                    </strong>{' '}
                    {notes.unresolvedTokens.join(', ')}. Regenerate rather
                    than editing by hand.
                  </div>
                )}

              {notes.flags && notes.flags.length > 0 && (
                <>
                  <p>
                    <strong>Gaps flagged for the family</strong>
                  </p>

                  <ul>
                    {notes.flags.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </>
              )}

              <p className="hint">
                Rules used:{' '}
                {manifest.map((m) => `${m.ruleId} v${m.version}`).join(', ') ||
                  'none'}
              </p>

              <ReviewActions
                packId={p.id}
                caseId={p.case_id}
                held={held}
              />
            </div>
          );
        })
      )}
    </>
  );
}