import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_PATH) {
  throw new Error('DATABASE_PATH env var is not set');
}

// Ensure the data directory exists before opening the DB file
mkdirSync(dirname(resolve(process.env.DATABASE_PATH)), { recursive: true });

const db = new Database(process.env.DATABASE_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create migration tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name       TEXT NOT NULL PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const applied = new Set(
  db.prepare('SELECT name FROM _migrations').all().map((r) => r.name),
);

const migrationsDir = join(__dirname, 'migrations');
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(migrationsDir, file), 'utf8');
  db.exec(sql);
  db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
  console.log(`Applied migration: ${file}`);
}

export default db;
