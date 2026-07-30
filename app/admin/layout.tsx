import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') redirect('/login');

  return (
    <div className="flex h-screen">
      <aside
        className="w-56 border-r border-border p-4 flex flex-col gap-2"
        aria-label="Admin navigation"
      >
        <h2 className="text-lg font-bold mb-2">Admin Panel</h2>
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin">Dashboard</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin/campaigns">Campaigns</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin/characters">Characters</Link>
        </Button>
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href="/admin/sessions">Session Notes</Link>
        </Button>
        <div className="mt-auto pt-4 border-t">
          <Button asChild variant="outline" className="w-full">
            <Link href="/characters">Back to Characters</Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
