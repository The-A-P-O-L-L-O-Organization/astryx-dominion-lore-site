import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import * as schema from './schema';
import { schemaDdl } from './schema-ddl';

const dbPath = process.env.DATABASE_PATH || './data/app.db';
mkdirSync(dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.exec(schemaDdl);

export const db = drizzle(sqlite, { schema });
