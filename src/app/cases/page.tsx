import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { statusLabel } from '@/lib/statusLabel'

export const dynamic = 'force-dynamic';

/**
 * Case list. No user filter in the query — row-level security scopes it, and
 * writing `.eq('owner_id', user.id)` here would imply the database is not
 * already enforcing that. It is.
 */
export default async function Cases() {
  const supabase = await supabaseServer();
  const { data: cases, error } = await supabase
    .from('cases')
    .select('id, deceased_name, status, created_at, advocate_referral_needed')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <>
        <h1>Your cases</h1>
        <div className="notice warn" role="alert">
          <strong>We could not load your cases just now.</strong>
          <p style={{ margin: '0.5rem 0 0' }}>
            This is a temporary problem on our side, not a sign anything is lost.
            Please refresh in a moment.
          </p>
        </div>
      </>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <>
        <h1>Your cases</h1>
        <p>You have not started a case yet.</p>
        <Link href="/intake" className="primary">Start a case</Link>
      </>
    );
  }

  return (
    <>
      <h1>Your cases</h1>

      {cases.map((c) => (
        <Link key={c.id as string} href={`/cases/${c.id}`} className="card as-card-link">
          <h2 style={{ marginBottom: '0.25rem' }}>{c.deceased_name as string}</h2>
          <p className="hint" style={{ margin: 0 }}>
            {statusLabel(c.status as string)}
            {' · started '}
            {new Date(c.created_at as string).toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
          {c.advocate_referral_needed ? (
            <p className="hint" style={{ margin: '0.5rem 0 0' }}>
              Needs an advocate for part of the process
            </p>
          ) : null}
        </Link>
      ))}

      <Link href="/intake" className="quiet">Start another case</Link>
    </>
  );
}

/**
 * Families see plain, calm language. Internal states like 'queued' and the
 * reviewer's hold reasons never surface here — "we are checking a few things"
 * is true, and explaining that our template review date lapsed is not their
 * problem to carry.
 */
