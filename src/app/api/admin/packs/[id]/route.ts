import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import {
  supabaseServer,
  supabaseAdmin,
  currentUser,
} from '@/lib/supabase/server';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().max(500).optional(),
  caseId: z.string().uuid(),
});

type AdminPack = {
  id: string;
  status: string;
  case_id: string;
};

type PackUpdate = {
  status: 'approved' | 'rejected';
  reviewed_by: string;
  reviewed_at: string;
  review_notes: string | null;
};

/**
 * Approve or reject a pack.
 *
 * The admin check is repeated here even though middleware already ran. That
 * is deliberate: middleware protects page routes by matcher, and a matcher is
 * one config edit away from missing an API path. Authorisation belongs next to
 * the thing being authorised.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'unauthorised' },
      { status: 401 },
    );
  }

  const supabase = await supabaseServer();

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json(
      { error: 'not found' },
      { status: 404 },
    );
  }

  const parsed = bodySchema.safeParse(
    await request.json().catch(() => null),
  );

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'bad request' },
      { status: 400 },
    );
  }

  const { id } = await params;
  const { action, notes, caseId } = parsed.data;

  const db = supabaseAdmin();

  const { data: pack } = await db
    .from('packs')
    .select('id, status, case_id')
    .eq('id', id)
    .single() as {
      data: AdminPack | null;
    };

  if (!pack) {
    return NextResponse.json(
      { error: 'not found' },
      { status: 404 },
    );
  }

  if (pack.case_id !== caseId) {
    return NextResponse.json(
      { error: 'mismatch' },
      { status: 400 },
    );
  }

  // A held pack cannot be approved, full stop. The fix is to resolve what
  // held it and regenerate — not to wave it through. Enforced server-side
  // because the UI hiding the button is not a control.
  if (action === 'approve' && pack.status !== 'generated') {
    return NextResponse.json(
      {
        error:
          'This pack is held and cannot be approved. Resolve the hold and regenerate.',
      },
      { status: 409 },
    );
  }

  const updateData: PackUpdate = {
    status: action === 'approve' ? 'approved' : 'rejected',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    review_notes: notes ?? null,
  };

  await db
    .from('packs')
    .update(updateData as never)
    .eq('id', id);

  if (action === 'approve') {
    await db
      .from('cases')
      .update({ status: 'delivered' } as never)
      .eq('id', caseId);
  } else {
    await db
      .from('cases')
      .update({ status: 'in_review' } as never)
      .eq('id', caseId);
  }

  await audit(
    action === 'approve' ? 'pack.approve' : 'pack.reject',
    {
      actorId: user.id,
      caseId,
      detail: {
        packId: id,
        hasNotes: Boolean(notes),
      },
    },
  );

  return NextResponse.json({
    ok: true,
    action,
  });
}