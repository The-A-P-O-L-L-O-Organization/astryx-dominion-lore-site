'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import { type CharacterNav } from '@/components/app-sidebar';
import { DEFAULT_THEME, resolveThemeForPath } from '@/lib/themes';

export function ThemeController({
  characters,
}: {
  characters: CharacterNav[];
}) {
  const pathname = usePathname();

  useEffect(() => {
    const theme = resolveThemeForPath(pathname, characters);
    const el = document.documentElement;
    if (theme === DEFAULT_THEME) delete el.dataset.theme;
    else el.dataset.theme = theme;
  }, [pathname, characters]);

  return null;
}
