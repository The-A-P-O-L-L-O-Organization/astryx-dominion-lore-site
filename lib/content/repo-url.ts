const ALLOWED_PROTOCOLS = ['http:', 'https:', 'ssh:', 'git:'];
const SCP_LIKE = /^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+:[A-Za-z0-9._\-/]+$/;

export function isAllowedRepoUrl(url: string): boolean {
  if (!url || url.startsWith('-') || /\s/.test(url)) return false;

  const scpMatch = url.match(/^([^@]+)@([^:]+):(.+)$/);
  if (scpMatch) {
    const [_, user, host] = scpMatch;
    if (user.startsWith('-') || host.startsWith('-')) return false;
    if (SCP_LIKE.test(url)) return true;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.startsWith('-') || parsed.username.startsWith('-')) {
      return false;
    }
    return ALLOWED_PROTOCOLS.includes(parsed.protocol) && !!parsed.hostname;
  } catch {
    return false;
  }
}
