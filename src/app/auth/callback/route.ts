import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer, supabaseAdmin } from '@/lib/supabase/server';
import { hashForAudit } from '@/lib/crypto';
import { safeRedirect } from '@/lib/safe-redirect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Magic-link callback. Exchanges the code for a session and records consent.
 *
 * Note the `next` handling: an open redirect here would let an attacker send
 * a legitimate-looking Mera Hissa sign-in link that lands the user on their own
 * site, session in hand. Only same-origin relative paths are accepted.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = safeRedirect(url.searchParams.get('next'));

  if (!code) return NextResponse.redirect(new URL('/signin', request.url));

  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/signin?error=link_expired', request.url));
  }

  // Record consent on first sign-in. `consent_at` being null is the flag.
  //
  // maybeSingle, not single: single() treats "no row" as an error, and a user
  // with no profile row is precisely the case this block now has to handle.
  const { data: profile } = await supabase
    .from('profiles').select('consent_at').eq('id', data.user.id).maybeSingle();

  if (!profile?.consent_at) {
    const version = (data.user.user_metadata?.consent_version as string | undefined)
      ?? 'unversioned';

    // The IP is hashed, never stored. It proves consent came from a consistent
    // origin without us holding an address we have no use for. hashForAudit
    // returns null when no salt is configured rather than a brute-forceable
    // unsalted hash, so the column is simply left empty in that case.
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

    // Upsert, not update. `cases.owner_id` references this table, so a signed-in
    // user without a profile row cannot create a case at all — the insert fails
    // on the foreign key and the family is told only that we could not save it.
    //
    // The row is supposed to exist because on_auth_user_created makes one at
    // signup, but that trigger fires exactly once and nothing reconciles after
    // it. Any account created while the trigger was absent stays broken forever.
    // Upserting here makes the invariant self-healing at every sign-in instead
    // of depending on one event having gone right, once, in the past.
    //
    // Still written through the service role: the consent columns are not
    // user-writable (migration 0003 grants the family only full_name and phone).
    const { error: profileError } = await supabaseAdmin().from('profiles').upsert({
      id: data.user.id,
      consent_version: version,
      consent_at: new Date().toISOString(),
      consent_ip_hash: forwarded ? hashForAudit(forwarded) : null,
    } as never, { onConflict: 'id' });

    // Do not swallow this. A failure here means the next thing the user does —
    // creating a case — will fail on the foreign key, and the log line here is
    // the only place that would say why.
    if (profileError) {
      console.error('[auth] profile upsert failed; case creation will fail on the '
        + 'owner_id foreign key until this is resolved', profileError);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
