'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NavItem {
  path: string;
  title: string;
  category?: string;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

export function LoreSidebar({
  items,
  characterId,
  campaignName,
}: {
  items: NavItem[];
  characterId: string;
  campaignName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const groups = items.reduce<NavGroup[]>((acc, item) => {
    const cat = item.category || 'General';
    let group = acc.find((g) => g.category === cat);
    if (!group) {
      group = { category: cat, items: [] };
      acc.push(group);
    }
    group.items.push(item);
    return acc;
  }, []);

  function handleMobileSelect(value: string) {
    if (!value) return;
    router.push(`/ch/${characterId}/lore/${value}`);
  }

  return (
    <>
      <div className="w-full md:hidden">
        <Select onValueChange={handleMobileSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Jump to lore page..." />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.category} value="" disabled>
                {group.category}
              </SelectItem>
            ))}
            {groups.flatMap((group) =>
              group.items.map((item) => (
                <SelectItem key={item.path} value={item.path} className="pl-6">
                  {group.category} / {item.title}
                </SelectItem>
              )),
            )}
          </SelectContent>
        </Select>
      </div>
      <aside className="hidden shrink-0 md:block md:w-64">
        <div className="sticky top-0 space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">
              {campaignName}
            </h2>
            <p className="text-xs text-muted-foreground">Lore Index</p>
          </div>
          <nav aria-label="Lore sections" className="space-y-1">
            {groups.map((group) => (
              <SidebarGroup
                key={group.category}
                group={group}
                characterId={characterId}
                currentPath={pathname}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

function SidebarGroup({
  group,
  characterId,
  currentPath,
}: {
  group: NavGroup;
  characterId: string;
  currentPath: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const activeCount = group.items.filter(
    (item) => currentPath === `/ch/${characterId}/lore/${item.path}`,
  ).length;

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full justify-start gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        {group.category}
      </Button>
      {expanded && (
        <div className="ml-4 space-y-0.5 border-l border-border pl-2">
          {group.items.map((item) => {
            const href = `/ch/${characterId}/lore/${item.path}`;
            const isActive = currentPath === href;
            return (
              <Link
                key={item.path}
                href={href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <FileText className="size-3 shrink-0" />
                {item.title}
                {activeCount > 0 && isActive && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
