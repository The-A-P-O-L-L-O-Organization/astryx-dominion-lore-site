export const THEMES = [
  'techno',
  'ember',
  'cyber',
  'forest',
  'arctic',
  'void',
] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
  techno: 'Techno',
  ember: 'Ember',
  cyber: 'Cyber',
  forest: 'Forest',
  arctic: 'Arctic',
  void: 'Void',
};

export const isTheme = (v: unknown): v is Theme =>
  typeof v === 'string' && (THEMES as readonly string[]).includes(v);

export const themeLabel = (theme: string): string =>
  isTheme(theme) ? THEME_LABELS[theme] : theme;

export const DEFAULT_THEME = THEMES[0];

export const coerceTheme = (v: unknown): Theme =>
  isTheme(v) ? v : DEFAULT_THEME;

export const resolveThemeForPath = (
  pathname: string,
  characters: { id: number; theme: string }[],
): Theme => {
  const match = pathname.match(/^\/ch\/(\d+)(?=\/|$)/);
  if (!match) return DEFAULT_THEME;
  const character = characters.find((c) => c.id === Number(match[1]));
  return character ? coerceTheme(character.theme) : DEFAULT_THEME;
};
