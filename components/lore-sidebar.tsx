'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  path: string
  title: string
  category?: string
}

interface NavGroup {
  category: string
  items: NavItem[]
}

export function LoreSidebar({ items, characterId, campaignName }: { items: NavItem[]; characterId: string; campaignName: string }) {
  const pathname = usePathname()

  const groups = items.reduce<NavGroup[]>((acc, item) => {
    const cat = item.category || 'General'
    let group = acc.find(g => g.category === cat)
    if (!group) {
      group = { category: cat, items: [] }
      acc.push(group)
    }
    group.items.push(item)
    return acc
  }, [])

  return (
    <aside className="w-64 border-r border-border h-screen overflow-y-auto p-4 shrink-0">
      <div className="mb-6">
        <h2 className="text-lg font-bold">{campaignName}</h2>
        <p className="text-xs text-muted-foreground">Lore Index</p>
      </div>
      <nav className="space-y-1">
        {groups.map(group => (
          <SidebarGroup key={group.category} group={group} characterId={characterId} currentPath={pathname} />
        ))}
      </nav>
    </aside>
  )
}

function SidebarGroup({ group, characterId, currentPath }: { group: NavGroup; characterId: string; currentPath: string }) {
  const [expanded, setExpanded] = useState(true)
  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground py-1"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {group.category}
      </button>
      {expanded && (
        <div className="ml-4 space-y-0.5">
          {group.items.map(item => {
            const href = `/ch/${characterId}/lore/${item.path}`
            const isActive = currentPath === href
            return (
              <Link
                key={item.path}
                href={href}
                className={`flex items-center gap-2 text-sm py-1 px-2 rounded transition-colors ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <FileText className="h-3 w-3 shrink-0" />
                {item.title}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
