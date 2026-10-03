import { redirect } from 'next/navigation';
import { getSession } from '@/src/data/repository';

export default async function ProfileRedirectPage() {
  const user = await getSession();
  const handle = user?.handle || 'elenavance';
  redirect(`/u/${handle}`);
}
