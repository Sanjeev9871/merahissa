import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { validateLead, type LeadInput } from '@/lib/leads';
import { supabaseAdmin } from '@/lib/supabase/server';
import { rateLimit, rateLimitHeaders } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LeadCaseSummary = {
  regime?: string;
  heirCount?: number;
  assetKinds?: string[];
  needsAdvocate?: boolean;
  suggestedTier?: string;
};

type LeadInsert = {
  name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  case_summary: LeadCaseSummary | null;
  consent_to_contact: boolean;
  consent_to_updates: boolean;
};

/**
 * Accepts a contact request.
 *
 * The only endpoint anonymous visitors can write through, so it is rate
 * limited by hashed IP and the database enforces the consent and contact
 * constraints independently of this code.
 *
 * The response is deliberately identical whether or not we already hold this
 * person's details — otherwise the form becomes a way to test whether a given
 * email address has used Mera Hissa, which for a bereavement service is a real
 * privacy leak.
 */
export async function POST(request: NextRequest) {
  // Never store a raw IP; we only need a stable key for rate limiting.
  const ip =
    request.headers
      .get('x-forwarded-for')
      ?.split(',')[0]
      ?.trim() ?? 'unknown';

  const ipKey = createHash('sha256')
    .update(`lead:${ip}`)
    .digest('hex')
    .slice(0, 32);

  const limit = await rateLimit('general', ipKey);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: 'Please wait a moment before sending that again.',
      },
      {
        status: 429,
        headers: rateLimitHeaders(limit),
      },
    );
  }

  const body = (await request.json().catch(() => null)) as LeadInput | null;

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      {
        error: 'Something went wrong sending that.',
      },
      { status: 400 },
    );
  }

  const result = validateLead(body);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.message,
        field: result.error,
      },
      { status: 422 },
    );
  }

  const { lead } = result;

  const leadInsert: LeadInsert = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    message: lead.message,
    source: lead.source,
    case_summary: lead.caseSummary ?? null,
    consent_to_contact: true,
    consent_to_updates: lead.consentToUpdates,
  };

  const { error } = await supabaseAdmin()
    .from('leads')
    .insert(leadInsert as never);

  if (error) {
    console.error('[leads] insert failed', error.message);

    return NextResponse.json(
      {
        error:
          'We could not save that just now. Please try again, or email us directly.',
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      contactedVia: lead.email ? 'email' : 'phone',
    },
    {
      status: 201,
      headers: rateLimitHeaders(limit),
    },
  );
}