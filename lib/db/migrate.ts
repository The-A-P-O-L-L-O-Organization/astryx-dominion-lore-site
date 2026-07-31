import Database from 'better-sqlite3';
import { schemaDdl } from './schema-ddl';

const dbPath = process.env.DATABASE_PATH || './data/app.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

sqlite.exec(schemaDdl);

console.log('Database migrated successfully');
sqlite.close();
