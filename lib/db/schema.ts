import { sqliteTable, text, integer, unique } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('player'),
  createdAt: text('created_at').notNull().default("datetime('now')"),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  expiresAt: text('expires_at').notNull(),
});

export const campaigns = sqliteTable('campaigns', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  loreRepoUrl: text('lore_repo_url').notNull(),
  theme: text('theme').notNull().default('sci-fi'),
  isHidden: integer('is_hidden', { mode: 'boolean' }).notNull().default(false),
  starMapConfig: text('star_map_config').notNull().default('{}'),
  createdAt: text('created_at').notNull().default("datetime('now')"),
});

export const characters = sqliteTable('characters', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  campaignId: integer('campaign_id')
    .notNull()
    .references(() => campaigns.id),
  name: text('name').notNull(),
  info: text('info').notNull().default(''),
  isApproved: integer('is_approved', { mode: 'boolean' })
    .notNull()
    .default(false),
  createdAt: text('created_at').notNull().default("datetime('now')"),
});

export const pageVisibility = sqliteTable(
  'page_visibility',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    pagePath: text('page_path').notNull(),
    isHidden: integer('is_hidden', { mode: 'boolean' }).notNull().default(true),
  },
  (t) => ({
    unq: unique().on(t.campaignId, t.pagePath),
  }),
);

export const sectionVisibility = sqliteTable(
  'section_visibility',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    pagePath: text('page_path').notNull(),
    sectionId: text('section_id').notNull(),
    isHidden: integer('is_hidden', { mode: 'boolean' }).notNull().default(true),
  },
  (t) => ({
    unq: unique().on(t.campaignId, t.pagePath, t.sectionId),
  }),
);

export const contentCache = sqliteTable(
  'content_cache',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    pagePath: text('page_path').notNull(),
    markdownRaw: text('markdown_raw').notNull(),
    htmlRendered: text('html_rendered').notNull(),
    frontmatter: text('frontmatter').notNull().default('{}'),
    planetData: text('planet_data'),
    updatedAt: text('updated_at').notNull().default("datetime('now')"),
  },
  (t) => ({
    unq: unique().on(t.campaignId, t.pagePath),
  }),
);

export const sessionNotes = sqliteTable(
  'session_notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    campaignId: integer('campaign_id')
      .notNull()
      .references(() => campaigns.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    contentMd: text('content_md').notNull(),
    authorId: integer('author_id').references(() => users.id),
    source: text('source').notNull().default('in-app'),
    isDmOnly: integer('is_dm_only', { mode: 'boolean' })
      .notNull()
      .default(false),
    createdAt: text('created_at').notNull().default("datetime('now')"),
    updatedAt: text('updated_at').notNull().default("datetime('now')"),
  },
  (t) => ({
    unq: unique().on(t.campaignId, t.slug),
  }),
);
