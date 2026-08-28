import type { NextConfig } from 'next';

/**
 * Security headers.
 *
 * The CSP is generated per request in middleware so Next.js can use a nonce
 * for its generated inline scripts. Do not define CSP here.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  async headers() {
    const securityHeaders = [
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      // No feature this app uses needs any of these.
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(self)' },
    ];

    // A family's case must never be cached by an intermediary. This is scoped
    // to the routes that actually carry case data rather than applied to
    // `/:path*` — a blanket no-store also lands on the content-hashed
    // `/_next/static` bundle and the public guide pages, so every visitor
    // re-downloads the JS on each view and the marketing pages the SEO strategy
    // depends on can never be served from a CDN edge.
    const noStore = { key: 'Cache-Control', value: 'no-store, max-age=0' };

    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/cases/:path*', headers: [noStore] },
      { source: '/admin/:path*', headers: [noStore] },
      { source: '/intake/:path*', headers: [noStore] },
      { source: '/api/:path*', headers: [noStore] },
    ];
  },
};

export default nextConfig;