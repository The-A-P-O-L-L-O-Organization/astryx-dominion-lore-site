import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.user.role !== 'admin') redirect('/login')

  return (
    <div className="flex h-screen">
      <aside className="w-56 border-r border-border p-4 flex flex-col gap-2">
        <h2 className="text-lg font-bold mb-2">Admin Panel</h2>
        <Link href="/admin"><Button variant="ghost" className="w-full justify-start">Dashboard</Button></Link>
        <Link href="/admin/campaigns"><Button variant="ghost" className="w-full justify-start">Campaigns</Button></Link>
        <Link href="/admin/characters"><Button variant="ghost" className="w-full justify-start">Characters</Button></Link>
        <Link href="/admin/sessions"><Button variant="ghost" className="w-full justify-start">Session Notes</Button></Link>
        <div className="mt-auto pt-4 border-t">
          <Link href="/characters"><Button variant="outline" className="w-full">Back to Characters</Button></Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  )
}
