# Astryx Dominion Lore Site

A lore browsing website for the Astryx Dominion D&D sci-fi campaign. DMs write markdown in git repos; players browse with per-campaign visibility gating, session notes, and a 3D star map.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** shadcn/ui + Tailwind CSS 3.4
- **Database:** SQLite via Drizzle ORM + better-sqlite3
- **3D:** Three.js via @react-three/fiber + drei
- **Auth:** bcryptjs + HTTP-only cookie sessions
- **Runtime:** Node 26, pnpm 11
- **Deployment:** Docker (single container)

## Features

- **Character-based access** — players create characters per campaign, admins approve them
- **Markdown lore pages** — sidebar navigation, nested pages, rendered via remark/rehype
- **Visibility gating** — DMs control which pages and sections are hidden per campaign
- **Session notes** — shared session logs and DM-only prep notes, synced with git
- **3D Star Map** — galaxy → system → planet surface zoom levels with Three.js
- **Admin panel** — campaign CRUD, character approval, visibility toggles, session notes
- **Theme system** — per-campaign CSS variables (sci-fi, fantasy, etc.)

## Getting Started

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first user to register becomes admin.

## Deployment

```bash
docker compose up -d
```

The app runs on port 3000. Data is persisted in a Docker volume. A cron job polls git repos every 5 minutes.

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
