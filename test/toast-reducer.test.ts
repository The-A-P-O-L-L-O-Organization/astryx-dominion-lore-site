import { describe, it, expect } from 'vitest';
import { reducer } from '@/hooks/use-toast';

const baseToast = {
  id: '1',
  title: 'Test',
  description: 'Desc',
  open: true,
  onOpenChange: () => {},
};

describe('reducer', () => {
  it('ADD_TOAST adds a toast', () => {
    const state = { toasts: [] };
    const next = reducer(state, { type: 'ADD_TOAST', toast: baseToast });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].title).toBe('Test');
  });

  it('ADD_TOAST enforces TOAST_LIMIT (1)', () => {
    const state = { toasts: [baseToast] };
    const next = reducer(state, {
      type: 'ADD_TOAST',
      toast: { ...baseToast, id: '2' },
    });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('2');
  });

  it('UPDATE_TOAST updates existing toast', () => {
    const state = { toasts: [baseToast] };
    const next = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated', open: true, onOpenChange: () => {} },
    });
    expect(next.toasts[0].title).toBe('Updated');
  });

  it('DISMISS_TOAST sets open to false', () => {
    const state = { toasts: [baseToast] };
    const next = reducer(state, { type: 'DISMISS_TOAST', toastId: '1' });
    expect(next.toasts[0].open).toBe(false);
  });

  it('DISMISS_TOAST with no toastId dismisses all', () => {
    const t2 = { ...baseToast, id: '2' };
    const state = { toasts: [baseToast, t2] };
    const next = reducer(state, { type: 'DISMISS_TOAST' });
    expect(next.toasts.every((t) => t.open === false)).toBe(true);
  });

  it('REMOVE_TOAST removes a specific toast', () => {
    const t2 = { ...baseToast, id: '2' };
    const state = { toasts: [baseToast, t2] };
    const next = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' });
    expect(next.toasts).toHaveLength(1);
    expect(next.toasts[0].id).toBe('2');
  });

  it('REMOVE_TOAST with no toastId removes all', () => {
    const state = { toasts: [baseToast, { ...baseToast, id: '2' }] };
    const next = reducer(state, { type: 'REMOVE_TOAST' });
    expect(next.toasts).toHaveLength(0);
  });

  it('returns state unchanged for unknown action', () => {
    const state = { toasts: [baseToast] };
    const next = reducer(state, { type: 'UNKNOWN' } as any);
    expect(next).toBe(state);
  });
});
