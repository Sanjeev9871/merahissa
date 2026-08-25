import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer, supabaseAdmin, currentUser } from '@/lib/supabase/server';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const { id } = await params;
  const supabase = await supabaseServer();

  const [kase, heirs, assets, packs, documents] = await Promise.all([
    supabase.from('cases').select('*').eq('id', id).single(),
    supabase.from('heirs').select('*').eq('case_id', id),
    supabase.from('assets').select('*').eq('case_id', id),
    supabase.from('packs').select('id, version, status, created_at').eq('case_id', id),
    supabase.from('documents').select('id, doc_type, uploaded_at, bytes').eq('case_id', id),
  ]);

  if (!kase.data) return NextResponse.json({ error: 'not found' }, { status: 404 });

  await audit('case.view', { actorId: user.id, caseId: id });

  return NextResponse.json({
    case: kase.data,
    heirs: heirs.data ?? [],
    assets: assets.data ?? [],
    packs: packs.data ?? [],
    documents: documents.data ?? [],
  });
}

/**
 * DPDP Act right to erasure.
 *
 * Deliberately a hard delete, not a soft one. A `deleted_at` flag would leave
 * a death certificate and a family's financial holdings sitting in the
 * database indefinitely, which is exactly what the person asked us not to do.
 *
 * Note the policy design that backs this: `cases_delete_own` grants DELETE to
 * the owner only. Admins cannot delete a case — only the data principal can.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const { id } = await params;
  const supabase = await supabaseServer();

  // Collect storage paths BEFORE the cascade removes the rows that name them,
  // otherwise the objects are orphaned in the bucket forever.
  const { data: docs } = await supabase
    .from('documents').select('storage_path').eq('case_id', id);

  const { error } = await supabase.from('cases').delete().eq('id', id);

  if (error) {
    console.error('[cases] delete failed', error);
    return NextResponse.json({ error: 'We could not delete this case.' }, { status: 500 });
  }

  const paths = (docs ?? []).map((d) => d.storage_path as string);
  if (paths.length > 0) {
    // Storage removal needs the service role; the bucket is private and has
    // no per-user delete policy.
    const { error: storageError } = await supabaseAdmin()
      .storage.from('case-documents').remove(paths);

    if (storageError) {
      // The database rows are already gone, so we cannot retry from state.
      // Log loudly: this needs manual cleanup and it is a compliance issue.
      console.error('[cases] ORPHANED STORAGE OBJECTS after delete', { paths, storageError });
    }
  }

  await audit('case.delete', {
    actorId: user.id, caseId: id,
    detail: { documentsRemoved: paths.length },
  });

  return NextResponse.json({ deleted: true, documentsRemoved: paths.length });
}
