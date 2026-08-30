import { ImageResponse } from 'next/og';

// Code-generated favicon so no binary asset has to live in the repo. Next wires
// this up as <link rel="icon"> automatically. A Latin monogram (not the
// Devanagari म) because next/og's default font does not cover Devanagari and
// would render a tofu box.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#6b4423',
          color: '#faf8f5',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        M
      </div>
    ),
    size,
  );
}
