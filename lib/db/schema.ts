import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('player'),
  approved: integer('approved', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default('datetime(\'now\')'),
})

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  expiresAt: text('expires_at').notNull(),
})

export const pageOverrides = sqliteTable('page_overrides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  pageSlug: text('page_slug').unique().notNull(),
  visibility: text('visibility').notNull().default('hidden'),
  updatedAt: text('updated_at').notNull().default('datetime(\'now\')'),
})
