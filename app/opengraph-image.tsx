import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};
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
          alignItems: 'flex-start',
          justifyContent: 'center',
          backgroundColor: '#0F1117',
          color: '#FFFFFF',
          fontFamily: 'sans-serif',
          padding: '72px 80px',
        }}
      >
        <div
          style={{
            width: 96,
            height: 8,
            backgroundColor: '#B3123C',
            borderRadius: 4,
            marginBottom: 32,
          }}
        />
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          ShortDramaIndex
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 34,
            fontWeight: 400,
            lineHeight: 1.35,
            color: '#C7CBD4',
          }}
        >
          Cross-Market Vertical Drama Database &amp; Benchmarks
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
