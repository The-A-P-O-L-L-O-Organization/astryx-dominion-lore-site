import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('resolves tailwind conflicts', () => {
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('handles array arguments', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('handles object arguments', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });

  it('handles undefined values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });

  it('merges multiple tailwind classes correctly', () => {
    expect(cn('text-red-500', 'text-blue-700')).toBe('text-blue-700');
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-700')).toBe('bg-blue-700');
  });
});
