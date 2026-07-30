# Security Policy

## Supported Versions

Only the latest commit on the `main` branch receives security updates. There are no release versions or LTS branches.

| Version         | Supported |
| --------------- | --------- |
| `main` (latest) | ✅        |
| Older commits   | ❌        |

## Reporting a Vulnerability

This project uses several dependencies that may introduce vulnerabilities. If you discover a security issue:

1. **Do not open a public issue.** Instead, email the repository owner directly or use GitHub's private vulnerability reporting if enabled.
2. Include a description of the vulnerability, steps to reproduce, and a suggested fix if possible.
3. You should receive a response within 7 days.

If the vulnerability is accepted, a fix will be applied to `main` and a notice will be added to the commit message. If declined, an explanation will be provided.

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

## Dependencies

This project uses Dependabot for automated dependency scanning on GitHub. Review Dependabot alerts for known vulnerabilities in direct and transitive dependencies.

## Deployment Considerations

This application is designed for **LAN-only deployment behind a reverse proxy**. If you expose it to the internet:

- Place it behind HTTPS with a valid certificate
- Configure a Web Application Firewall
- Set strong `SESSION_SECRET` and admin credentials
- Consider adding rate limiting to all auth endpoints (only register is rate-limited by default)
- Review the cron poller endpoint `GET /api/poll-content` — it is unauthenticated by design for cron access
