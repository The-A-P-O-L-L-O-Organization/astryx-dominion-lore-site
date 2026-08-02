'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Map,
  Newspaper,
  Orbit,
  Rocket,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export interface CharacterNav {
  id: number;
  name: string;
  theme: string;
}

interface AppSidebarProps {
  characters: CharacterNav[];
  isAdmin: boolean;
  username: string;
}

export function AppSidebar({ characters, isAdmin, username }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openCharacterId, setOpenCharacterId] = useState<number | null>(null);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const adminActive = pathname.startsWith('/admin');

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[active=true]:bg-transparent"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Orbit className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">Astryx Dominion</span>
                <span className="text-xs text-muted-foreground">
                  {username}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/characters'}
                  tooltip="Characters"
                >
                  <Link href="/characters">
                    <Users />
                    <span>Characters</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {characters.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Characters</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {characters.map((character) => {
                  const active = pathname.startsWith(`/ch/${character.id}`);
                  return (
                    <Collapsible
                      key={character.id}
                      asChild
                      open={openCharacterId === character.id}
                      onOpenChange={(open) =>
                        setOpenCharacterId(open ? character.id : null)
                      }
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={active}
                            className="group/collapsible"
                          >
                            <Rocket />
                            <span>{character.name}</span>
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname.startsWith(
                                  `/ch/${character.id}/lore`,
                                )}
                              >
                                <Link href={`/ch/${character.id}/lore`}>
                                  <Newspaper />
                                  <span>Lore</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname.startsWith(
                                  `/ch/${character.id}/sessions`,
                                )}
                              >
                                <Link href={`/ch/${character.id}/sessions`}>
                                  <Map />
                                  <span>Sessions</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname.startsWith(
                                  `/ch/${character.id}/starmap`,
                                )}
                              >
                                <Link href={`/ch/${character.id}/starmap`}>
                                  <Orbit />
                                  <span>Star Map</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin'}
                    tooltip="Dashboard"
                  >
                    <Link href="/admin">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin/campaigns'}
                    tooltip="Campaigns"
                  >
                    <Link href="/admin/campaigns">
                      <Rocket />
                      <span>Campaigns</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin/characters'}
                    tooltip="Characters"
                  >
                    <Link href="/admin/characters">
                      <Users />
                      <span>Characters</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/admin/sessions'}
                    tooltip="Session Notes"
                  >
                    <Link href="/admin/sessions">
                      <Map />
                      <span>Session Notes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut />
              Log out
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
