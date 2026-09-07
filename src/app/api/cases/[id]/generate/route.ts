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
import { decryptPii } from '@/lib/crypto';
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
 * Decrypts a stored account reference, returning null rather than throwing if
 * the key is absent or the ciphertext no longer decrypts. Generation must
 * degrade to the masked reference, not fail outright.
 */
function decryptRef(ciphertext: string | null): string | null {
  if (!ciphertext) return null;
  try {
    return decryptPii(ciphertext);
  } catch (e) {
    console.error('[generate] could not decrypt account reference; using mask', e);
    return null;
  }
}

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

  // A pack that has already been delivered (or the case closed) must not be
  // silently regenerated — that would re-run the pipeline, queue a redundant
  // pack, and knock the case back to 'in_review'. The UI never offers this, but
  // the route is reachable directly.
  if (kase.status === 'delivered' || kase.status === 'closed') {
    return NextResponse.json(
      { error: 'This case has already been prepared.' },
      { status: 409 },
    );
  }

  // Payment gate. Authoritative check against the payments table, which only a
  // signature-verified webhook can write (payments_admin_write). We never trust
  // cases.status for this: a client that could move its own case to 'paid'
  // would otherwise unlock generation without paying.
  const { data: capturedPayments, error: paymentLookupError } = await supabaseAdmin()
    .from('payments')
    .select('id')
    .eq('case_id', id)
    .eq('status', 'captured')
    .limit(1);

  if (paymentLookupError) {
    // A transient failure of this lookup must not be reported to a paid family
    // as "not paid". Fail as a retryable server error instead.
    console.error('[generate] payment lookup failed', paymentLookupError);
    return NextResponse.json(
      { error: 'We could not confirm your payment just now. Please try again in a moment.' },
      { status: 503 },
    );
  }

  if (!capturedPayments || capturedPayments.length === 0) {
    return NextResponse.json(
      {
        error: 'This case has not been paid for yet.',
      },
      { status: 402 },
    );
  }

  // Status is written with the service role; the family has no UPDATE privilege
  // on public.cases (see migration 0003).
  await supabaseAdmin()
    .from('cases')
    .update({ status: 'generating' } as never)
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
      // The full reference, decrypted here and held only for the life of this
      // request. It is what an institution's claim form has to carry. It never
      // reaches the model: redactCase() swaps it for an {{ACCOUNT_n}} token
      // before the prompt is built, and assertNoPii() fails the request closed
      // if a raw account-shaped digit run ever survives into the payload.
      //
      // Falls back to the mask when the ciphertext is missing or undecryptable
      // (a case created before this column was populated, or a rotated key), so
      // an old case still generates rather than erroring.
      accountRef:
        decryptRef(a.account_ref_enc as string | null)
        ?? (a.account_ref_mask as string | null)
        ?? null,
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
  const renderHoldReasons: string[] = [];

  // Only render a PDF for a pack that actually cleared the gate. A held case
  // has nothing worth rendering and rendering it invites someone downloading
  // it by mistake.
  //
  // The render is wrapped: pdf-lib's standard fonts are WinAnsi-only and throw
  // on any character they cannot encode — a Devanagari name, a rupee sign in
  // model prose. Previously that threw out of the route as a 500 AFTER the case
  // had been moved to 'generating', permanently stranding a paid case that then
  // failed identically on every retry. Now a render failure holds the pack for
  // manual preparation with a reason the reviewer can act on.
  if (
    result.status === 'ready_for_review' &&
    result.narrative
  ) {
    try {
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
        renderHoldReasons.push(
          'The prepared pack could not be stored. Held for manual preparation.',
        );
      }
    } catch (renderError) {
      console.error('[generate] pack render failed', renderError);
      storagePath = null;

      const message =
        renderError instanceof Error ? renderError.message : String(renderError);

      renderHoldReasons.push(
        /WinAnsi cannot encode/.test(message)
          ? 'The pack could not be rendered because a name or value contains characters '
            + 'the current PDF font cannot print (for example Devanagari script). Held for '
            + 'manual preparation — a Unicode-capable font is needed to render this pack.'
          : 'The pack failed to render and is held for manual preparation.',
      );
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
        holdReasons: [...result.holdReasons, ...renderHoldReasons],
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