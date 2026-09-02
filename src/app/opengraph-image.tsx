import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

// A default share card for every page, code-generated (no binary asset). Next
// adds og:image and twitter:image pointing here; the absolute URL resolves via
// metadataBase once NEXT_PUBLIC_SITE_URL is set in production.
export const alt = 'Mera Hissa — estate claim paperwork for Indian families';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#faf8f5',
          fontFamily: 'serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#6b4423',
              color: '#faf8f5',
              fontSize: 40,
              fontWeight: 700,
              borderRadius: 8,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 40, color: '#1c1a17', letterSpacing: '0.01em' }}>
            {SITE.name}
          </div>
        </div>

        <div style={{ fontSize: 60, color: '#1c1a17', lineHeight: 1.15, maxWidth: 900 }}>
          The whole list of documents each institution needs &mdash; before you pay.
        </div>

        <div style={{ marginTop: 32, fontSize: 30, color: '#6b4423' }}>
          {SITE.tagline}
        </div>
      </div>
    ),
    size,
  );
}
