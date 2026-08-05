import { vi } from 'vitest';

export async function createMockDb() {
  const { default: Database } = (await vi.importActual('better-sqlite3')) as {
    default: typeof import('better-sqlite3');
  };
  const { drizzle } = await vi.importActual<
    typeof import('drizzle-orm/better-sqlite3')
  >('drizzle-orm/better-sqlite3');
  const schemaMod =
    await vi.importActual<typeof import('@/lib/db/schema')>('@/lib/db/schema');
  const ddlMod = await vi.importActual<typeof import('@/lib/db/schema-ddl')>(
    '@/lib/db/schema-ddl',
  );
  const sqlite = new Database(':memory:');
  sqlite.exec(ddlMod.schemaDdl);
  return { db: drizzle(sqlite, { schema: schemaMod }) };
}
