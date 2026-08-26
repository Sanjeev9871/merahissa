import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer, supabaseAdmin, currentUser } from '@/lib/supabase/server';
import { SIGNED_URL_TTL_SECONDS } from '@/lib/uploads';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Pack download.
 *
 * Redirects to a short-lived signed URL rather than streaming the bytes. Two
 * reasons: the object goes straight from storage to the browser without
 * passing through a serverless function, and the URL dies in ten minutes if it
 * is forwarded or ends up in a screenshot.
 *
 * Ownership is checked through the user's client first, so RLS decides. The
 * service role is used only to mint the signed URL, after that check passes.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const { id } = await params;
  const supabase = await supabaseServer();

  // packs is SELECT-able by the case owner under RLS, so a pack belonging to
  // someone else simply is not found.
  const { data: pack } = await supabase
    .from('packs')
    .select('id, case_id, status, storage_path, version')
    .eq('id', id)
    .single();

  if (!pack || !pack.storage_path) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Only an approved pack is downloadable. A generated-but-unreviewed pack
  // exists in storage, and this is what stops a family reaching it early by
  // guessing a URL.
  if (pack.status !== 'approved') {
    return NextResponse.json(
      { error: 'This pack is still being checked. We will email you when it is ready.' },
      { status: 409 },
    );
  }

  const { data: signed, error } = await supabaseAdmin()
    .storage.from('case-documents')
    .createSignedUrl(pack.storage_path as string, SIGNED_URL_TTL_SECONDS, {
      download: `merahissa-pack-v${pack.version as number}.pdf`,
    });

  if (error || !signed) {
    console.error('[download] could not sign URL', error);
    return NextResponse.json({ error: 'We could not prepare that download.' }, { status: 500 });
  }

  await audit('pack.download', {
    actorId: user.id,
    caseId: pack.case_id as string,
    detail: { packId: id, version: pack.version as number },
  });

  return NextResponse.redirect(signed.signedUrl);
}
