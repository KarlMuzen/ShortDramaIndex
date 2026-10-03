import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { mockUsers } from '@/src/data/mock';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('sdi_mock_user')?.value;
  const user = (userId ? mockUsers.find((u) => u.id === userId) : null) || mockUsers[0];

  return NextResponse.json(user, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
