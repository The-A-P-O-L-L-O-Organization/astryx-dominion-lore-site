# Contributing

This is a personal campaign lore site. Contributions are welcome but please open an issue first to discuss proposed changes.

## Guidelines

- No comments in code
- Use `params: Promise<...>` + `await params` for Next.js 16 route handlers
- Prefer Drizzle `.where(eq(...))` over `.filter()`
- Follow existing component patterns and naming conventions
- All shadcn components go in `components/ui/`
- Pull latest before branching; rebase before merging
