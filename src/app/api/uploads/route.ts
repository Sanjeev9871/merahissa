import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer, supabaseAdmin, currentUser } from '@/lib/supabase/server';
import { validateUpload, storagePath, MAX_UPLOAD_BYTES } from '@/lib/uploads';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOC_TYPES = new Set([
  'death_certificate', 'claimant_id', 'address_proof', 'bank_statement',
  'share_certificate', 'policy_document', 'will', 'other',
]);

/**
 * Document upload.
 *
 * OCR has already happened in the browser before this is called, and the user
 * has confirmed what we extracted. This route stores the file; it does not
 * read it beyond validating that it is what it claims to be.
 */
export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const limit = await rateLimit('upload', user.id);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'You have uploaded a lot of files recently. Please try again shortly.' },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'bad request' }, { status: 400 });

  const file = form.get('file');
  const caseId = String(form.get('caseId') ?? '');
  const docType = String(form.get('docType') ?? '');
  const ocrRaw = form.get('ocrFields');

  if (!(file instanceof File) || !caseId || !DOC_TYPES.has(docType)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }

  // Cheap check before reading the whole body into memory.
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'That file is larger than 8 MB. Please scan at a lower resolution.' },
      { status: 413 },
    );
  }

  // Ownership via RLS. If this returns nothing the case is not theirs — and
  // the response is the same 404 either way, so the endpoint cannot be used
  // to discover whether a case id exists.
  const supabase = await supabaseServer();
  const { data: kase } = await supabase.from('cases').select('id').eq('id', caseId).single();
  if (!kase) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const data = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload({ data, claimedMime: file.type });

  if (!check.ok) {
    await audit('doc.upload', {
      actorId: user.id, caseId,
      detail: { outcome: 'rejected', reason: check.reason },
    });
    return NextResponse.json({ error: check.message, reason: check.reason }, { status: 422 });
  }

  const path = storagePath(caseId, check.storageName);

  const { error: uploadError } = await supabaseAdmin()
    .storage.from('case-documents')
    .upload(path, data, { contentType: check.mime, upsert: false });

  if (uploadError) {
    console.error('[uploads] storage write failed', uploadError);
    return NextResponse.json({ error: 'We could not store that file.' }, { status: 500 });
  }

  // OCR fields come from the browser and were confirmed by the user, so they
  // are user input like any other — kept as a JSON blob for pre-filling, never
  // trusted as authoritative for the forms.
  let ocrFields: Record<string, string> | null = null;
  if (typeof ocrRaw === 'string') {
    try {
      const parsed: unknown = JSON.parse(ocrRaw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        ocrFields = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>)
            .slice(0, 20)
            .map(([k, v]) => [k.slice(0, 40), String(v).slice(0, 200)]),
        );
      }
    } catch { /* malformed OCR payload is not worth failing the upload over */ }
  }

  const { data: row, error: insertError } = await supabase.from('documents').insert({
    case_id: caseId,
    doc_type: docType,
    storage_path: path,
    sha256: check.sha256,
    bytes: check.bytes,
    ocr_fields: ocrFields,
  }).select('id').single();

  if (insertError || !row) {
    // Do not leave the object behind with no row pointing at it.
    await supabaseAdmin().storage.from('case-documents').remove([path]);
    return NextResponse.json({ error: 'We could not record that file.' }, { status: 500 });
  }

  await audit('doc.upload', {
    actorId: user.id, caseId,
    detail: { outcome: 'stored', docType, bytes: check.bytes },
  });

  return NextResponse.json(
    { id: row.id, docType, bytes: check.bytes },
    { status: 201, headers: rateLimitHeaders(limit) },
  );
}
