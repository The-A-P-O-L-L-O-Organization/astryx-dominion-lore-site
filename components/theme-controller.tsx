'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { type CharacterNav } from '@/components/app-sidebar';
import { DEFAULT_THEME, isTheme } from '@/lib/themes';

export function ThemeController({
  characters,
}: {
  characters: CharacterNav[];
}) {
  const pathname = usePathname();

  useEffect(() => {
    const match = pathname.match(/^\/ch\/(\d+)(?=\/|$)/);
    let theme: string | undefined;
    if (match) {
      const character = characters.find((c) => c.id === Number(match[1]));
      if (character && isTheme(character.theme)) theme = character.theme;
    }
    const el = document.documentElement;
    if (theme && theme !== DEFAULT_THEME) el.dataset.theme = theme;
    else delete el.dataset.theme;
  }, [pathname, characters]);

  return null;
}
