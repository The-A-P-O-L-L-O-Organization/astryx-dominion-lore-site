import { describe, it, expect } from 'vitest';
import { THEMES, THEME_LABELS, isTheme } from '@/lib/themes';

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
});
