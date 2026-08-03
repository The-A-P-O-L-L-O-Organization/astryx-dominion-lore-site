# Astryx Dominion Lore Site

A lore browsing website for D&D sci-fi campaign Astryx Dominion. DMs write markdown in git repos; players browse with character-based access, visibility gating, session notes, and a 3D star map.

## Features

- **Character-based access** — players create characters per campaign, must be approved by an admin before they can view lore
- **Markdown lore pages** — full directory-based page hierarchy with sidebar navigation, rendered via remark/rehype
- **Visibility gating** — DMs control which pages and sections are hidden per campaign; hidden content displays a blurred overlay with "Continue on your journey to unlock this"
- **Session notes** — shared session logs for all players and DM-only prep notes, synced bidirectionally with git
- **3D Star Map** — three zoom levels (galaxy → star system → planet surface) rendered with Three.js, configure systems, hyperlanes, orbital bodies, and surface markers in `star_map_config`
- **Admin panel** — campaign CRUD, character approval/rejection, visibility toggles per page and per section, session notes management, dashboard with stats
- **Theme system** — per-campaign CSS variables, ships with six dark themes (techno, ember, cyber, forest, arctic, void), extensible
- **Git content pipeline** — cron-based poller clones/pulls repos, parses markdown frontmatter + sections + planet data into the database

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | Next.js 16.2 (App Router)                       |
| UI           | shadcn/ui, Tailwind CSS 3.4, Radix primitives   |
| Database     | SQLite via Drizzle ORM + better-sqlite3         |
| 3D Rendering | Three.js, @react-three/fiber, @react-three/drei |
| Auth         | bcryptjs + HTTP-only cookie sessions            |
| Markdown     | gray-matter, remark, rehype, react-markdown     |
| Runtime      | Node 26, pnpm 11                                |
| Deployment   | Docker (single container with cron)             |

## Getting Started

### Prerequisites

- Node.js 26+
- pnpm 11 (`corepack enable && corepack prepare pnpm@11 --activate`)
- A git repository with markdown content (see Content Structure below)

### Development

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first user to register automatically becomes an admin.

### Production (Docker)

```bash
docker compose up -d
```

The app serves on port 3000. Data persists in the `lore-data` Docker volume. Cron polls git repos every 5 minutes.

Environment variables:

| Variable         | Default         | Description                        |
| ---------------- | --------------- | ---------------------------------- |
| `DATABASE_PATH`  | `./data/app.db` | Path to SQLite database file       |
| `CONTENT_DIR`    | `./data/repos`  | Directory for cloned git repos     |
| `SESSION_SECRET` | (required)      | Secret for signing session cookies |

## Configuration

### Campaigns

Each campaign links to a git repo containing lore content. Create a campaign in the admin panel with:

- **Name** — display name for the campaign
- **Description** — shown on the character selection page
- **Lore repo URL** — git clone URL for the content repository
- **Theme** — CSS theme to apply (`techno`, `ember`, `cyber`, `forest`, `arctic`, `void`); unknown values are coerced to `techno` unless registered as a new theme in `lib/themes.ts`
- **Star map config** — JSON defining galaxy systems, hyperlanes, and star properties (see Star Map section)
- **Hidden** — if enabled, the campaign is not visible to players

### Characters

Players create characters under a campaign. Each character has a name and optional info. An admin must approve the character before its player can view that campaign's lore. One player can have multiple characters across different campaigns.

## Content Structure

Your lore git repo should follow this structure:

```
content/
├── index.md              -- Campaign overview page
├── factions/
│   ├── index.md          -- Factions overview
│   └── house-vex.md      -- Individual faction page
└── planets/
    ├── index.md
    └── tyron-prime.md    -- Planet page (planet_data in frontmatter)

session-notes/
├── session-001.md        -- Player-visible session log
├── session-002-dm.md     -- DM-only prep notes (filename contains -dm)
└── session-003.md

planet_data/
└── tyron-prime/
    └── markers.json      -- Surface markers for the star map
```

### Markdown Frontmatter

Pages can include standard frontmatter. Planet pages additionally supply `planet_data`:

```yaml
---
title: Tyron Prime
type: planet
tags:
  - core-world
planet_data:
  type: planet
  name: Tyron Prime
  color: '#4a9eff'
  orbit_radius: 3.5
  orbit_speed: 0.15
  terrain_type: rocky
---
```

Frontmatter fields:

- `title` — display title (defaults to filename)
- `type` — content type (use `planet` for star map detection)
- `planet_data` — object with star map properties (color, orbit_radius, terrain_type, etc.)
- `tags` — array of tag strings (not yet used, reserved for future filtering)

### Session Notes

Files in `session-notes/` are parsed as session logs. Notes with `-dm` in the filename before `.md` are DM-only (hidden from players). Notes can also be created/edited in-app; in-app edits write back to the local git clone.

### Planet Data Files

The `planet_data/` directory mirrors planet page names. Each subdirectory can contain a `markers.json` defining surface markers for the star map:

```json
[
  {
    "id": "capital",
    "name": "Imperial Capital",
    "lat": 34.5,
    "lon": -12.3,
    "description": "Seat of the Dominion government",
    "type": "city"
  }
]
```

## Star Map

The star map has three zoom levels:

1. **Galaxy view** — star systems connected by hyperlane lines, click a star system to zoom in
2. **System view** — central star with orbiting planets, moons, stations, and asteroid belts; click a planet to view its surface
3. **Planet surface** — 3D sphere with color-coded terrain and marker pins

Configure systems in the campaign's `star_map_config`:

```json
{
  "systems": [
    {
      "id": "core-systems",
      "name": "Core Systems",
      "x": 0,
      "y": 0,
      "z": 0,
      "star": {
        "color": "#ffd700",
        "size": 2,
        "star_type": "yellow_dwarf"
      }
    }
  ],
  "hyperlanes": [["core-systems", "outer-rim"]]
}
```

Planets in the system view are automatically populated from content pages with `planet_data`. Hidden planets appear dimmed/locked.

## Visibility System

When content is ingested, all pages and sections start as **hidden**. An admin must explicitly reveal them in the admin panel's visibility section:

- **Page visibility** — hide or show entire lore pages
- **Section visibility** — hide or show individual `##` sections within a page

Hidden pages show: "Your knowledge of this topic is incomplete. Speak with your Dungeon Master to continue your journey."

Hidden sections are blurred client-side with: "This section is locked. Continue on your journey to unlock this knowledge."

## Auth System

- Username/password authentication with bcryptjs
- HTTP-only session cookies
- First registered user is automatically granted admin role
- IP-based rate limiting on the register endpoint
- Session middleware guards protected routes
- No approval check on login — approval is per-character

## Theme System

Themes are defined as CSS variable blocks in `globals.css` under `.dark[data-theme="..."]` selectors. The active theme is set as `data-theme` on `<html>` by a client-side controller based on the active character's campaign `theme` field. All themes are dark.

Built-in themes:

- `techno` — dark blue with cyan accents and amber highlights (default)
- `ember` — warm gold and flame
- `cyber` — near-black with phosphor green
- `forest` — emerald and moss
- `arctic` — glacial blue and frost
- `void` — violet and magenta

Add new themes by adding a `.dark[data-theme="your-theme"]` block in `globals.css` and registering the key in `lib/themes.ts`.

## API Routes

### Auth

| Route                | Method | Description                        |
| -------------------- | ------ | ---------------------------------- |
| `/api/auth/register` | POST   | Register a new user (rate-limited) |
| `/api/auth/login`    | POST   | Login with username/password       |
| `/api/auth/logout`   | POST   | Clear session                      |
| `/api/auth/session`  | GET    | Get current session info           |

### Campaigns

| Route            | Method | Description                |
| ---------------- | ------ | -------------------------- |
| `/api/campaigns` | GET    | List all campaigns (admin) |
| `/api/campaigns` | POST   | Create campaign (admin)    |

### Characters

| Route                         | Method | Description                      |
| ----------------------------- | ------ | -------------------------------- |
| `/api/characters`             | GET    | List characters for current user |
| `/api/characters`             | POST   | Create character                 |
| `/api/characters/:id/approve` | POST   | Approve/reject character (admin) |

### Content

| Route               | Method   | Description                                  |
| ------------------- | -------- | -------------------------------------------- |
| `/api/poll-content` | GET      | Trigger git pull + reparse for all campaigns |
| `/api/visibility`   | GET/POST | Get/set page and section visibility (admin)  |

### Sessions

| Route               | Method | Description                           |
| ------------------- | ------ | ------------------------------------- |
| `/api/sessions`     | GET    | List session notes (filtered by role) |
| `/api/sessions`     | POST   | Create or update a session note       |
| `/api/sessions/:id` | DELETE | Delete a session note                 |

## Project Structure

```
app/
├── admin/              -- Admin panel pages
├── api/                -- API routes
├── ch/[characterId]/   -- Player-facing pages (lore, sessions, starmap)
├── login/
├── register/
├── characters/
├── globals.css         -- Theme CSS variables
└── layout.tsx          -- Root layout with ThemeProvider

components/
├── ui/                 -- shadcn/ui components
├── lore-sidebar.tsx    -- Grouped, collapsible page navigation
├── lore-content.tsx    -- Content renderer with blur gating
├── theme-provider.tsx  -- Adds dark class to <html>
├── theme-controller.tsx  -- Sets data-theme on <html> from active character's theme
└── starmap/            -- Three.js star map components

lib/
├── db/
│   ├── schema.ts       -- Drizzle table definitions
│   ├── index.ts        -- Database connection
│   └── migrate.ts      -- Schema migration
├── content/
│   ├── poller.ts       -- Git clone/pull + parse orchestration
│   ├── parser.ts       -- Markdown frontmatter/sections/HTML parsing
│   └── visibility.ts   -- Visibility query helpers
└── auth.ts             -- Auth: hash, verify, sessions, rate-limit, first-admin
```

## License

GNU Affero General Public License v3.0 — see [LICENSE](LICENSE).
