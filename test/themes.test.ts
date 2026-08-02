import { describe, it, expect } from 'vitest';
import {
  THEMES,
  THEME_LABELS,
  isTheme,
  themeLabel,
  DEFAULT_THEME,
  coerceTheme,
} from '@/lib/themes';

describe('lib/themes', () => {
  it('lists exactly the six themes in order', () => {
    expect(THEMES).toEqual([
      'techno',
      'ember',
      'cyber',
      'forest',
      'arctic',
      'void',
    ]);
  });

  it('has a label for every theme and nothing extra', () => {
    for (const theme of THEMES) {
      expect(typeof THEME_LABELS[theme]).toBe('string');
    }
    expect(Object.keys(THEME_LABELS)).toHaveLength(THEMES.length);
  });

  it('validates known themes', () => {
    expect(isTheme('techno')).toBe(true);
    expect(isTheme('cyber')).toBe(true);
    expect(isTheme('void')).toBe(true);
  });

  it('rejects unknown, empty, and non-string themes', () => {
    expect(isTheme('ocean')).toBe(false);
    expect(isTheme('')).toBe(false);
    expect(isTheme('SCI-FI')).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(42)).toBe(false);
  });

  it('has a default theme of techno', () => {
    expect(DEFAULT_THEME).toBe('techno');
  });

  it('coerces valid themes to themselves and unknown or absent themes to the default', () => {
    expect(coerceTheme('techno')).toBe('techno');
    expect(coerceTheme('void')).toBe('void');
    expect(coerceTheme('ocean')).toBe('techno');
    expect(coerceTheme('sci-fi')).toBe('techno');
    expect(coerceTheme(undefined)).toBe('techno');
  });

  it('labels known themes and falls back to the raw string otherwise', () => {
    expect(themeLabel('techno')).toBe('Techno');
    expect(themeLabel('void')).toBe('Void');
    expect(themeLabel('sci-fi')).toBe('sci-fi');
    expect(themeLabel('toString')).toBe('toString');
  });
});
