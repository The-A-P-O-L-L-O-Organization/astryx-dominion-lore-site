const ALLOWED_PROTOCOLS = ['http:', 'https:', 'ssh:', 'git:'];
const SCP_LIKE = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+:[A-Za-z0-9._\-/]+$/;

/**
 * Only plain remote URLs may reach `git clone`. Rejects local paths,
 * `file://`, git's `ext::`/`fd::` transports (which execute shell commands)
 * and anything that git would parse as a command-line option.
 */
export function isAllowedRepoUrl(url: string): boolean {
  if (!url || url.startsWith('-') || /\s/.test(url)) return false;

  if (SCP_LIKE.test(url)) return true;

  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol) && !!parsed.hostname;
  } catch {
    return false;
  }
}
