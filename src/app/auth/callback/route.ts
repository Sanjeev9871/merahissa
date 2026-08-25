import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { hashForAudit } from '@/lib/crypto';
import { safeRedirect } from '@/lib/safe-redirect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Magic-link callback. Exchanges the code for a session and records consent.
 *
 * Note the `next` handling: an open redirect here would let an attacker send
 * a legitimate-looking Virasat sign-in link that lands the user on their own
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
  const { data: profile } = await supabase
    .from('profiles').select('consent_at').eq('id', data.user.id).single();

  if (!profile?.consent_at) {
    const version = (data.user.user_metadata?.consent_version as string | undefined)
      ?? 'unversioned';

    // The IP is hashed, never stored. It proves consent came from a consistent
    // origin without us holding an address we have no use for.
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

    await supabase.from('profiles').update({
      consent_version: version,
      consent_at: new Date().toISOString(),
      consent_ip_hash: forwarded ? hashForAudit(forwarded) : null,
    }).eq('id', data.user.id);
  }

  return NextResponse.redirect(new URL(next, request.url));
}
