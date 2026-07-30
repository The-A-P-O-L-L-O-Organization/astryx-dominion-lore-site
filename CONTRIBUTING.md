# Contributing

Thank you for your interest in Astryx Dominion Lore Site. This is a personal campaign wiki project, but contributions and improvements are welcome.

## Getting Started

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/astryx-dominion-lore-site.git
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development Workflow

```bash
# Start the dev server
pnpm run dev

# Build for production
pnpm run build

# Run tests
pnpm run test
```

The dev server runs at `http://localhost:3000`. The first registered user is automatically an admin.

## Code Standards

- **No comments in code.** Write self-documenting code with clear variable and function names.
- **Async params.** All Next.js 16 route handler params use `params: Promise<{ ... }>` with `await params`.
- **Drizzle conventions.** Use `db.select().from(table).where(eq(table.col, val))` — no `.filter()` calls.
- **TypeScript strict mode.** No `any` unless absolutely necessary. Use `@/` path aliases for imports.
- **Component patterns.** Follow existing component conventions. Client components use `'use client'` directive.
- **shadcn/ui.** All UI primitives go in `components/ui/`. Use the `pnpm dlx shadcn@latest add` command to add new ones.
- **Tailwind classes.** Use Tailwind utility classes directly. Custom CSS goes in `app/globals.css` under `@layer base`.

## Pull Request Process

1. Rebase your branch on latest `main` before opening a PR.
2. Ensure `pnpm run build` passes with zero errors and zero warnings.
3. Ensure `pnpm run test` passes (if tests exist for your changes).
4. Write a concise commit message describing what changed and why.
5. Open a PR with a clear title and description. Reference any related issues.
6. A maintainer will review and merge or request changes.

## Branch Naming

- `feat/` — new features (e.g., `feat/character-portraits`)
- `fix/` — bug fixes (e.g., `fix/visibility-duplicate-keys`)
- `chore/` — maintenance (e.g., `chore/upgrade-deps`)
- `docs/` — documentation (e.g., `docs/api-reference`)

## Commit Style

Use conventional commits:

```
feat: add character portrait upload
fix: resolve race condition in content poller
chore: upgrade next.js to 16.3.0
docs: add star map configuration example
```

## Adding a New Theme

1. Add a `[data-theme="your-theme"]` block in `app/globals.css` with all CSS variables.
2. The theme name becomes available in the campaign admin editor.

Required CSS variables: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`.

## Database Changes

If you modify `lib/db/schema.ts`, also update `lib/db/migrate.ts` with the corresponding raw SQL migration. This project does not use Drizzle Kit migrations; raw SQL in `migrate.ts` is the migration mechanism.

## Adding shadcn Components

```bash
pnpm dlx shadcn@latest add button
```

This installs the component to `components/ui/`. Always commit the new component file.

## Questions

Open a GitHub Discussion or issue for questions, feature requests, or bug reports.
