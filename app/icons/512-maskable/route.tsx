import { createPwaIcon } from '@/src/lib/pwa-icon';

export const dynamic = 'force-static';

export async function GET() {
  return createPwaIcon({ size: 512, maskable: true });
}
