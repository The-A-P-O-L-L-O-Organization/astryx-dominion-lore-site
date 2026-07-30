import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth';

describe('hashPassword', () => {
  it('returns a hash string', async () => {
    const hash = await hashPassword('test-password');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('produces different hashes for the same password', async () => {
    const hash1 = await hashPassword('same-password');
    const hash2 = await hashPassword('same-password');
    expect(hash1).not.toBe(hash2);
  });
});

describe('verifyPassword', () => {
  it('returns true for matching password', async () => {
    const password = 'my-secret-password';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct-password');
    const result = await verifyPassword('wrong-password', hash);
    expect(result).toBe(false);
  });

  it('returns false for empty password against hashed password', async () => {
    const hash = await hashPassword('something');
    const result = await verifyPassword('', hash);
    expect(result).toBe(false);
  });

  it('handles passwords with special characters', async () => {
    const password = 'P@ssw0rd! 你好 パスワード';
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it('handles very long passwords', async () => {
    const password = 'a'.repeat(100);
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });
});
