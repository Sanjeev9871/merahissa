import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // Supabase for data and storage; Razorpay for payment status.
    "connect-src 'self' https://*.supabase.co https://api.razorpay.com",
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
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
    // Everything except static assets and the favicon.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};