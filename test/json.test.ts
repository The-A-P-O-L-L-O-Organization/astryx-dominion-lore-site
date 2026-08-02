import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseJsonOrDefault, parseJsonOrThrow } from '@/lib/json';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseJsonOrThrow', () => {
  it('names the source in the thrown error', () => {
    expect(() => parseJsonOrThrow('{oops', 'markers.json')).toThrow(
      'Invalid JSON in markers.json',
    );
  });

  it('parses valid JSON', () => {
    expect(parseJsonOrThrow('{"a":1}', 'src')).toEqual({ a: 1 });
  });
});

describe('parseJsonOrDefault', () => {
  it('logs and falls back on corrupt JSON', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(
      parseJsonOrDefault('{oops', 'frontmatter for a', { title: 'x' }).title,
    ).toBe('x');
    expect(spy).toHaveBeenCalled();
  });

  it('falls back on empty values without logging', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseJsonOrDefault(null, 'src', {})).toEqual({});
    expect(spy).not.toHaveBeenCalled();
  });
});
