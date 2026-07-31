import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

export default async function AdminGuardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') redirect('/login');

  return <>{children}</>;
}
