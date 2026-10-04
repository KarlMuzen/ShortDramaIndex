import { ImageResponse } from 'next/og';

export function createPwaIcon({
  size,
  maskable = false,
}: {
  size: number;
  maskable?: boolean;
}) {
  // For maskable, keep the letter inside the central 80% (safe zone)
  const fontSize = maskable ? Math.round(size * 0.48) : Math.round(size * 0.6);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#B3123C',
          color: '#FFFFFF',
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          lineHeight: 1,
        }}
      >
        S
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
