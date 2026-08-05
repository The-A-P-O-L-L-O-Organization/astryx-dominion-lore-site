import { describe, it, expect } from 'vitest';
import { isAllowedRepoUrl } from '@/lib/content/repo-url';

describe('isAllowedRepoUrl', () => {
  it('accepts remote URLs', () => {
    expect(isAllowedRepoUrl('https://github.com/org/lore.git')).toBe(true);
    expect(isAllowedRepoUrl('http://gitea.lan/org/lore.git')).toBe(true);
    expect(isAllowedRepoUrl('ssh://git@github.com/org/lore.git')).toBe(true);
    expect(isAllowedRepoUrl('git@github.com:org/lore.git')).toBe(true);
  });

  it('rejects transports that execute commands', () => {
    expect(isAllowedRepoUrl('ext::sh -c "touch /tmp/pwned"')).toBe(false);
    expect(isAllowedRepoUrl('fd::7')).toBe(false);
  });

  it('rejects ssh option injection through host or userinfo', () => {
    expect(isAllowedRepoUrl('ssh://-oProxyCommand=touch%20/tmp/x')).toBe(false);
    expect(
      isAllowedRepoUrl('ssh://-oProxyCommand=sh%20-c%20id@host/repo'),
    ).toBe(false);
    expect(isAllowedRepoUrl('-oProxyCommand=touch /tmp/x')).toBe(false);
    expect(isAllowedRepoUrl('git@-oProxyCommand=x:org/lore.git')).toBe(false);
  });

  it('rejects local paths and option-like values', () => {
    expect(isAllowedRepoUrl('file:///etc')).toBe(false);
    expect(isAllowedRepoUrl('/etc/passwd')).toBe(false);
    expect(isAllowedRepoUrl('--upload-pack=touch /tmp/pwned')).toBe(false);
    expect(isAllowedRepoUrl('')).toBe(false);
  });
});
