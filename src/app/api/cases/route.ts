import { NextResponse, type NextRequest } from 'next/server';
import { caseSchema, fieldErrors } from '@/lib/validation';
import { supabaseServer, currentUser } from '@/lib/supabase/server';
import { computeShares, type Heir } from '@/lib/succession';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';
import { mask } from '@/lib/redaction';
import { encryptPii } from '@/lib/crypto';
import { audit } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Create a case from the intake wizard.
 *
 * Everything written here goes through the USER's Supabase client, so RLS
 * decides what is permitted. The route never uses the service role: if a
 * write fails, the policy is what needs fixing.
 */
export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const limit = await rateLimit('general', user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, {
      status: 429, headers: rateLimitHeaders(limit),
    });
  }

  const parsed = caseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  const input = parsed.data;
  const supabase = await supabaseServer();

  // Decide the advocate flag up front, from the deterministic engine. This is
  // what drives pricing and whether the case can ever be auto-generated, so it
  // is computed at write time rather than inferred later.
  const shares = computeShares(
    input.regime,
    input.heirs.map((h, i): Heir => ({
      id: `h${i}`, relationship: h.relationship, isClaimant: h.isClaimant,
    })),
    { deceasedWasFemale: input.deceasedWasFemale },
  );

  const { data: kase, error } = await supabase
    .from('cases')
    .insert({
      owner_id: user.id,
      status: 'intake_complete',
      deceased_name: input.deceasedName,
      deceased_dod: input.deceasedDateOfDeath ?? null,
      // Drives the female-intestate branch of the share engine (HSA s.15/16).
      // Collected and validated at intake but previously dropped here, so every
      // downstream read fell back to the column default and computed a woman's
      // estate under the male rules.
      deceased_was_female: input.deceasedWasFemale,
      regime: input.regime,
      has_will: input.hasWill,
      will_is_registered: input.willIsRegistered,
      advocate_referral_needed: shares.requiresAdvocate,
      referral_reason: shares.advocateReason ?? null,
    })
    .select('id')
    .single();

  if (error || !kase) {
    console.error('[cases] insert failed', error);
    return NextResponse.json({ error: 'We could not save your case.' }, { status: 500 });
  }

  const caseId = kase.id as string;

  const { error: heirError } = await supabase.from('heirs').insert(
    input.heirs.map((h) => ({
      case_id: caseId,
      full_name: h.fullName,
      relationship: h.relationship,
      is_minor: h.isMinor,
      is_claimant: h.isClaimant,
    })),
  );

  // The full reference is needed to fill an institution's claim form, so it is
  // encrypted with a key that lives only in the application environment — a
  // database dump alone yields ciphertext. The masked form is what every screen
  // renders; the plaintext exists only in memory here and at render time.
  //
  // Fail SAFE, not open: if the encryption key is missing or invalid we store
  // the mask alone rather than falling back to plaintext. A pack that has to be
  // completed by hand is a bad afternoon; an account number sitting in clear
  // text in Postgres is a breach.
  let encryptionUnavailable = false;

  const encryptRef = (ref: string | undefined): string | null => {
    if (!ref) return null;
    try {
      return encryptPii(ref);
    } catch (e) {
      if (!encryptionUnavailable) {
        console.error('[cases] PII_ENCRYPTION_KEY unusable — storing masked reference only', e);
        encryptionUnavailable = true;
      }
      return null;
    }
  };

  const { error: assetError } = await supabase.from('assets').insert(
    input.assets.map((a) => ({
      case_id: caseId,
      kind: a.kind,
      institution: a.institution,
      account_ref_enc: encryptRef(a.accountRef),
      account_ref_mask: a.accountRef ? mask(a.accountRef) : null,
      value_band: a.valueBand,
      has_nomination: a.hasNomination,
      is_joint: a.isJoint,
    })),
  );

  if (heirError || assetError) {
    // Partial writes leave a case that will generate a wrong pack. Roll back
    // by deleting the parent; the cascade removes whatever landed.
    await supabase.from('cases').delete().eq('id', caseId);
    console.error('[cases] child insert failed', heirError ?? assetError);
    return NextResponse.json({ error: 'We could not save your case.' }, { status: 500 });
  }

  await audit('case.create', {
    actorId: user.id, caseId,
    detail: {
      heirs: input.heirs.length,
      assets: input.assets.length,
      regime: input.regime,
      advocate: shares.requiresAdvocate,
    },
  });

  return NextResponse.json({
    caseId,
    advocateReferralNeeded: shares.requiresAdvocate,
    referralReason: shares.advocateReason ?? null,
  }, { status: 201, headers: rateLimitHeaders(limit) });
}

/** List the signed-in user's cases. RLS scopes this; no filter needed. */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const supabase = await supabaseServer();
  const { data } = await supabase
    .from('cases')
    .select('id, deceased_name, status, created_at, advocate_referral_needed')
    .order('created_at', { ascending: false });

  return NextResponse.json({ cases: data ?? [] });
}
