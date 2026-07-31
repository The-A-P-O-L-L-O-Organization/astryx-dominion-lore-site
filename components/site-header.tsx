'use client';

import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

import { type CharacterNav } from '@/components/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

const LABELS: Record<string, string> = {
  admin: 'Admin',
  campaigns: 'Campaigns',
  characters: 'Characters',
  lore: 'Lore',
  sessions: 'Sessions',
  starmap: 'Star Map',
};

export function SiteHeader({ characters }: { characters: CharacterNav[] }) {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);
  const items: { href: string; label: string; isPage: boolean }[] = [];
  let href = '';

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    href += `/${segment}`;
    let label = LABELS[segment] ?? segment;

    if (segment === 'ch' && segments[i + 1] !== undefined) {
      const character = characters.find(
        (c) => c.id === Number(segments[i + 1]),
      );
      if (character) {
        items.push({
          href: `/ch/${character.id}/lore`,
          label: character.name,
          isPage: false,
        });
      }
      i += 1;
      href += `/${segments[i]}`;
      if (i < segments.length - 1) {
        items.push({
          href,
          label: LABELS[segments[i]] ?? segments[i],
          isPage: false,
        });
        continue;
      }
      const last = LABELS[segments[i]] ?? segments[i];
      items.push({ href, label: last, isPage: true });
      continue;
    }

    items.push({
      href,
      label,
      isPage: i === segments.length - 1,
    });
  }

  return (
    <header className="flex shrink-0 items-center gap-2 border-b px-4 h-(--header-height)">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <Fragment key={item.href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.isPage || index === items.length - 1 ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
