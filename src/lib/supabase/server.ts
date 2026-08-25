import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Supabase clients.
 *
 * Two of them, and the distinction matters more than anything else in this
 * file:
 *
 *   supabaseServer()  — acts AS THE LOGGED-IN USER. Row level security
 *                       applies. This is the default and should be used for
 *                       essentially everything.
 *
 *   supabaseAdmin()   — service role. BYPASSES RLS ENTIRELY. Use only where
 *                       a request legitimately acts outside any one user's
 *                       authority: the admin review queue, the Razorpay
 *                       webhook, the retention purge job.
 *
 * Reaching for the admin client because a query "didn't work" is how RLS
 * gets silently defeated. If a user-scoped query returns nothing, the policy
 * is the thing to fix.
 */

export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Session refresh is handled by middleware; safe to ignore.
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options, maxAge: 0 });
          } catch {
            /* see above */
          }
        },
      },
    },
  );
}

let adminSingleton: ReturnType<typeof createClient> | null = null;

export function supabaseAdmin() {
  // A guard, not a comment. If this module is ever pulled into a client
  // bundle the service role key would ship to the browser, so fail loudly.
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin() was called in the browser. This is a security bug.');
  }

  adminSingleton ??= createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  return adminSingleton;
}

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable ${name}`);
  return v;
}

/** Convenience: the current user, or null. */
export async function currentUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Throws if not signed in. Use at the top of every mutating route. */
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Response('Unauthorised', { status: 401 });
  return user;
}
