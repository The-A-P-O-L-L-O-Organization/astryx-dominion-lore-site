import Database from 'better-sqlite3';
import { schemaDdl } from './schema-ddl';
import { themeMigrationSql } from './theme-migration';

const dbPath = process.env.DATABASE_PATH || './data/app.db';
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

sqlite.exec(schemaDdl);
sqlite.exec(themeMigrationSql);

console.log('Database migrated successfully');
sqlite.close();
