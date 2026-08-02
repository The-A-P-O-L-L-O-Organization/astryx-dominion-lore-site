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
