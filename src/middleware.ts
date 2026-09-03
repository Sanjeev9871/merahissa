import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware. Three jobs.
 *
 * 1. Refresh the Supabase session. Server Components cannot write cookies, so
 *    without this a token silently expires mid-flow and a family loses a
 *    half-filled intake form.
 *
 * 2. Gate protected routes. This is a first line, not the only one — the real
 *    enforcement is row-level security in Postgres. Middleware can be bypassed
 *    by a misconfigured matcher; RLS cannot. Both exist on purpose.
 *
 * 3. Generate a per-request CSP nonce. Next.js uses this nonce for its
 *    generated inline scripts, allowing a strict production CSP without
 *    enabling unsafe-inline for scripts.
 */

const PROTECTED = ['/intake', '/cases', '/admin'];
const ADMIN_ONLY = ['/admin'];

function buildCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== 'production';

  return [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://us-assets.i.posthog.com"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // Supabase for data and storage; Razorpay for payment status.
    "connect-src 'self' https://*.supabase.co https://api.razorpay.com https://us.i.posthog.com https://us-assets.i.posthog.com",
    "frame-src https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(
    crypto.randomUUID(),
  ).toString('base64');

  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);

  // Next.js reads this nonce during dynamic rendering.
  requestHeaders.set('x-nonce', nonce);

  // The root layout reads this to pick the language for the site chrome and the
  // <html lang> attribute. A layout cannot otherwise see the pathname.
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // Next.js also needs to see the CSP on the request.
  requestHeaders.set(
    'Content-Security-Policy',
    csp,
  );

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(
    'Content-Security-Policy',
    csp,
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) =>
          request.cookies.get(name)?.value,

        set: (
          name: string,
          value: string,
          options: CookieOptions,
        ) => {
          request.cookies.set({
            name,
            value,
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          response.cookies.set({
            name,
            value,
            ...options,
            ...COOKIE_HARDENING,
          });

          response.headers.set(
            'Content-Security-Policy',
            csp,
          );
        },

        remove: (
          name: string,
          options: CookieOptions,
        ) => {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });

          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });

          response.headers.set(
            'Content-Security-Policy',
            csp,
          );
        },
      },
    },
  );

  // getUser() revalidates against Supabase. getSession() only decodes the
  // cookie, which a client can forge, so it must not be used for auth checks.
  // getUser() revalidates against Supabase over the network. Wrap it so an
  // auth-service outage (or a single bad env var) degrades to "signed out"
  // rather than returning 500 for every route — including the public marketing
  // pages, which carry no session and nothing to protect. The API routes are
  // excluded from the matcher entirely, so the payment webhook and cron purge
  // never pay for this call.
  let user: User | null = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (e) {
    console.error('[middleware] auth check failed; treating request as signed out', e);
  }

  const path = request.nextUrl.pathname;

  if (
    PROTECTED.some((p) => path.startsWith(p)) &&
    !user
  ) {
    const url = request.nextUrl.clone();

    url.pathname = '/signin';

    // Preserve where they were going so they land back there after signing in.
    url.searchParams.set('next', path);

    return NextResponse.redirect(url);
  }

  if (
    ADMIN_ONLY.some((p) => path.startsWith(p))
  ) {
    if (!user) {
      return NextResponse.redirect(
        new URL('/signin', request.url),
      );
    }

    // Fail closed: if the admin lookup cannot be confirmed (Supabase down, or
    // it throws), deny access rather than fall through to the queue.
    let isAdmin = false;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      isAdmin = Boolean(profile?.is_admin);
    } catch (e) {
      console.error('[middleware] admin check failed; denying access', e);
    }

    if (!isAdmin) {
      // 404, not 403. A 403 confirms /admin exists and is worth attacking.
      return new NextResponse('Not found', {
        status: 404,
        headers: {
          'Content-Security-Policy': csp,
        },
      });
    }
  }

  return response;
}

const COOKIE_HARDENING: Partial<CookieOptions> = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export const config = {
  matcher: [
    // Everything except static assets, the favicon, and the API. API routes
    // authenticate themselves and return JSON that needs no CSP nonce, so the
    // payment webhook and cron purge must not carry a Supabase auth round trip.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};