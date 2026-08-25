import { NextResponse, type NextRequest } from 'next/server';
import {
  supabaseServer,
  supabaseAdmin,
  currentUser,
} from '@/lib/supabase/server';
import { generatePack } from '@/lib/pipeline';
import {
  buildPackDocument,
  assertDisclaimerPresent,
} from '@/lib/pdf/document';
import { renderPack } from '@/lib/pdf/render';
import {
  rateLimit,
  rateLimitHeaders,
} from '@/lib/ratelimit';
import { audit } from '@/lib/audit';
import type { AssetKind, ValueBand } from '@/lib/redaction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Params = {
  params: Promise<{ id: string }>;
};

type ExistingPack = {
  version: number;
};

/**
 * Generate a pack.
 *
 * Every path through this route ends with the pack in the review queue. There
 * is no branch that delivers to a family directly — `status` is either
 * 'queued' (held, needs work) or 'generated' (ready for a human to approve).
 * Approval is a separate, admin-only action.
 */
export async function POST(
  _request: NextRequest,
  { params }: Params,
) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json(
      { error: 'unauthorised' },
      { status: 401 },
    );
  }

  const limit = await rateLimit('ai', user.id);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error:
          'You have generated several packs recently. Please try again later.',
      },
      {
        status: 429,
        headers: rateLimitHeaders(limit),
      },
    );
  }

  const { id } = await params;
  const supabase = await supabaseServer();

  const [
    { data: kase },
    { data: heirs },
    { data: assets },
  ] = await Promise.all([
    supabase
      .from('cases')
      .select('*')
      .eq('id', id)
      .single(),

    supabase
      .from('heirs')
      .select('*')
      .eq('case_id', id),

    supabase
      .from('assets')
      .select('*')
      .eq('case_id', id),
  ]);

  if (!kase) {
    return NextResponse.json(
      { error: 'not found' },
      { status: 404 },
    );
  }

  // Payment gate. Checked against the payments table, which only a verified
  // webhook can write, not against anything the client told us.
  if (kase.status !== 'paid' && kase.status !== 'generating') {
    return NextResponse.json(
      {
        error: 'This case has not been paid for yet.',
      },
      { status: 402 },
    );
  }

  await supabase
    .from('cases')
    .update({ status: 'generating' })
    .eq('id', id);

  const result = await generatePack({
    caseId: id,
    deceasedName: kase.deceased_name as string,
    deceasedDateOfDeath:
      (kase.deceased_dod as string | null) ?? null,
    regime:
      kase.regime as Parameters<typeof generatePack>[0]['regime'],
    hasWill: Boolean(kase.has_will),
    willIsRegistered:
      (kase.will_is_registered as boolean | null) ?? null,
    deceasedWasFemale: Boolean(kase.deceased_was_female),

    heirs: (heirs ?? []).map((h) => ({
      id: h.id as string,
      fullName: h.full_name as string,
      relationship: h.relationship as string,
      isMinor: Boolean(h.is_minor),
      isClaimant: Boolean(h.is_claimant),
    })),

    assets: (assets ?? []).map((a) => ({
      id: a.id as string,
      kind: a.kind as AssetKind,
      institution: a.institution as string,
      accountRef:
        (a.account_ref_mask as string | null) ?? null,
      valueBand: a.value_band as ValueBand,
      hasNomination:
        (a.has_nomination as boolean | null) ?? null,
      isJoint: Boolean(a.is_joint),
    })),
  });

  const db = supabaseAdmin();

  // Version, never overwrite. A regenerated pack must not silently replace one
  // a family may already have printed and taken to a bank.
  const { data: existing } = await db
    .from('packs')
    .select('version')
    .eq('case_id', id)
    .order('version', { ascending: false })
    .limit(1) as {
      data: ExistingPack[] | null;
    };

  const version = (existing?.[0]?.version ?? 0) + 1;

  if (version > 1) {
    await db
      .from('packs')
      .update({ status: 'superseded' } as never)
      .eq('case_id', id)
      .in('status', ['queued', 'generated']);
  }

  let storagePath: string | null = null;

  // Only render a PDF for a pack that actually cleared the gate. A held case
  // has nothing worth rendering and rendering it invites someone downloading
  // it by mistake.
  if (
    result.status === 'ready_for_review' &&
    result.narrative
  ) {
    const heirNames = new Map(
      (heirs ?? []).map((h) => [
        h.id as string,
        h.full_name as string,
      ]),
    );

    const institutions = new Map(
      (assets ?? []).map((a) => [
        a.id as string,
        a.institution as string,
      ]),
    );

    const doc = buildPackDocument({
      caseRef: `CASE-${id.slice(0, 8).toUpperCase()}`,
      deceasedName: kase.deceased_name as string,
      dateOfDeath:
        (kase.deceased_dod as string | null) ?? null,
      heirNames,
      shares: result.shares,
      requirements: result.requirements,
      narrative: result.narrative,
      manifest: result.manifest,
      institutionByAsset: institutions,
    });

    // Compliance gate, not a formatting check. Throws rather than warns.
    assertDisclaimerPresent(doc);

    const bytes = await renderPack(doc);

    storagePath = `${id}/pack-v${version}.pdf`;

    const { error: uploadError } = await db.storage
      .from('case-documents')
      .upload(
        storagePath,
        bytes,
        {
          contentType: 'application/pdf',
          upsert: true,
        },
      );

    if (uploadError) {
      console.error(
        '[generate] pack upload failed',
        uploadError,
      );
      storagePath = null;
    }
  }

  await db
    .from('packs')
    .insert({
      case_id: id,
      version,

      // 'generated' still means "awaiting human approval". Nothing here sets
      // 'approved' — that is only ever a person, in the admin queue.
      status:
        result.status === 'ready_for_review' &&
          storagePath
          ? 'generated'
          : 'queued',

      template_manifest: result.manifest,

      model_notes: {
        holdReasons: result.holdReasons,
        unresolvedTokens: result.unresolvedTokens,
        flags: result.narrative?.flags ?? [],
      },

      storage_path: storagePath,
    } as never);

  await db
    .from('cases')
    .update({ status: 'in_review' } as never)
    .eq('id', id);

  await audit('pack.generate', {
    actorId: user.id,
    caseId: id,
    detail: {
      version,
      outcome: result.status,
      holds: result.holdReasons.length,
      rendered: Boolean(storagePath),
    },
  });

  return NextResponse.json(
    {
      version,
      status: result.status,

      // Hold reasons are internal reviewer notes. The family sees a neutral
      // "we are checking a few things" message, not our template staleness.
      inReview: true,
    },
    {
      headers: rateLimitHeaders(limit),
    },
  );
}