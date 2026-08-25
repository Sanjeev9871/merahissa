import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/server';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Retention purge. Runs daily from Vercel Cron.
 *
 * Deletes documents past their 90-day expiry, in both the database and the
 * storage bucket. The SQL function returns the storage paths it removed rows
 * for, so the two stay in step: rows first, then objects, and anything that
 * fails object deletion is logged loudly because an orphaned death
 * certificate in a bucket is exactly the thing retention exists to prevent.
 *
 * Auth is a shared secret compared in constant time. A cron endpoint that
 * anyone can call is a denial-of-service lever at best.
 */
export async function GET(request: NextRequest) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const db = supabaseAdmin();

  const { data, error } = await db.rpc('purge_expired_documents');
  if (error) {
    console.error('[purge] rpc failed', error);
    return NextResponse.json({ error: 'purge failed' }, { status: 500 });
  }

  const paths = ((data ?? []) as Array<{ deleted_path: string }>)
    .map((r) => r.deleted_path)
    .filter(Boolean);

  let removed = 0;
  let failed = 0;

  // Batch, because a long-running case can accumulate many documents and the
  // storage API has per-request limits.
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error: storageError } = await db.storage.from('case-documents').remove(batch);

    if (storageError) {
      failed += batch.length;
      console.error('[purge] ORPHANED OBJECTS — storage removal failed', {
        count: batch.length, storageError,
      });
    } else {
      removed += batch.length;
    }
  }

  await audit('doc.purge', { detail: { rows: paths.length, removed, failed } });

  // A non-zero `failed` needs a human. Surface it in the response so the cron
  // dashboard shows a problem rather than a green tick.
  return NextResponse.json({ rows: paths.length, removed, failed }, {
    status: failed > 0 ? 207 : 200,
  });
}

function authorised(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error('[purge] CRON_SECRET is not set; refusing to run');
    return false;
  }

  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}
