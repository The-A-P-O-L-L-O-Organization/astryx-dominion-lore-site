import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

const listeners = new Set<() => void>();

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
}

const addEventListener = vi.fn((_: string, cb: () => void) => {
  listeners.add(cb);
});
const removeEventListener = vi.fn((_: string, cb: () => void) => {
  listeners.delete(cb);
});

beforeEach(() => {
  listeners.clear();
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener,
    removeEventListener,
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});

afterEach(() => {
  setWidth(1024);
});

describe('useIsMobile', () => {
  it('reports false for a desktop-width viewport', () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('reports true for a viewport narrower than the breakpoint', () => {
    setWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('treats the breakpoint itself as desktop', () => {
    setWidth(768);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates when the media query fires a change', () => {
    setWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    setWidth(400);
    act(() => {
      listeners.forEach((cb) => cb());
    });
    expect(result.current).toBe(true);
  });

  it('removes its listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());
    expect(addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    expect(listeners.size).toBe(0);
  });
});
