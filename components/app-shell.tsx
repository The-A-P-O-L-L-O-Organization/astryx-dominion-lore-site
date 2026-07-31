'use client';

import { type CharacterNav, AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface AppShellProps {
  characters: CharacterNav[];
  isAdmin: boolean;
  username: string;
  children: React.ReactNode;
}

export function AppShell({
  characters,
  isAdmin,
  username,
  children,
}: AppShellProps) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 14)',
        } as React.CSSProperties
      }
    >
      <AppSidebar
        characters={characters}
        isAdmin={isAdmin}
        username={username}
      />
      <SidebarInset>
        <SiteHeader characters={characters} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4 md:gap-6 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
