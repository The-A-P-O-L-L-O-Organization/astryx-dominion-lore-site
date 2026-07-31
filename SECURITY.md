# Security Policy

## Supported Versions

The latest release, along with the latest commit on the `main` branch, receives security updates. [GitHub Releases](https://github.com/The-A-P-O-L-L-O-Organization/astryx-dominion-lore-site/releases) are published from `main`; the latest release is supported, while older releases are not (there is no backporting to superseded versions). There are no LTS branches.

| Version                 | Supported |
| ----------------------- | --------- |
| `main` (latest)         | ✅        |
| Latest GitHub release   | ✅        |
| Older releases          | ❌        |
| Older commits           | ❌        |

## Reporting a Vulnerability

Please **do not open a public issue** for security problems. Instead, use one of these private channels:

- **Preferred:** GitHub's private vulnerability reporting (https://github.com/The-A-P-O-L-L-O-Organization/astryx-dominion-lore-site/security/advisories/new)
- **Fallback:** Email the maintainer directly at mgs008@outlook.com, or open a private security advisory.

When reporting, include:

1. A description of the vulnerability and the affected component/route
2. Steps to reproduce (with a minimal example if possible)
3. The impact you believe it has
4. A suggested fix, if you have one

You should receive an acknowledgement within 48 hours and a full response within 7 days. If the report is accepted, a fix will be applied to `main` and a GitHub Security Advisory will be published after a coordinated release. If declined, you will receive an explanation of why.

## Scope

The following are in scope:

- Auth bypass or session hijacking
- SQL injection (via the API layer)
- Arbitrary file read/write through content ingestion
- XSS via rendered markdown
- Remote code execution

The following are out of scope:

- Dependency vulnerabilities already tracked by Dependabot
- Rate limiting bypass (unless it enables account takeover)
- Host header injection on a LAN-only deployment
- Missing HTTPS (LAN-only deployment is by design)

## Security Tooling

- **Dependabot** automatically scans direct and transitive dependencies for known vulnerabilities (both on the `main` branch and in the `ghcr.io/the-a-p-o-l-l-o-organization/astryx-dominion-lore-site` Docker image).
- **CodeQL** code scanning runs on every push and pull request to catch SQL injection, cross-site scripting, path traversal, and other Common Weakness Enumerations (CWEs) in the source.
- Alerts from both tools are visible in the repository's **Security** tab. Review them and address any new findings promptly.

## Deployment Considerations

This application is designed for **LAN-only deployment behind a reverse proxy**. If you expose it to the internet:

- Place it behind HTTPS with a valid certificate
- Configure a Web Application Firewall
- Set strong `SESSION_SECRET` and admin credentials
- Consider adding rate limiting to all auth endpoints (only register is rate-limited by default)
- Review the cron poller endpoint `GET /api/poll-content`. It is unauthenticated by default (LAN-only design). If the `POLL_SECRET` environment variable is set, the endpoint instead requires the `x-poll-secret` header to match it (or an authenticated admin session) — set it when exposing the app beyond a trusted network.
