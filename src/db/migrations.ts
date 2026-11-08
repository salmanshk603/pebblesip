/**
 * Ordered schema migrations, tracked with SQLite's `PRAGMA user_version`.
 * Append new entries; never edit a shipped one.
 */
export const MIGRATIONS: readonly string[] = [
  // v1: initial schema (prd.md §9)
  `
  CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
  CREATE TABLE drinks (
    id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, factor REAL NOT NULL DEFAULT 1,
    icon TEXT NOT NULL, is_custom INTEGER NOT NULL DEFAULT 0, premium INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE cups (id TEXT PRIMARY KEY NOT NULL, amount_ml INTEGER NOT NULL, sort_order INTEGER NOT NULL);
  CREATE TABLE logs (
    id TEXT PRIMARY KEY NOT NULL, ts INTEGER NOT NULL, date TEXT NOT NULL,
    amount_ml INTEGER NOT NULL, drink_id TEXT NOT NULL REFERENCES drinks(id), effective_ml INTEGER NOT NULL
  );
  CREATE INDEX logs_date_idx ON logs(date);
  CREATE INDEX logs_ts_idx ON logs(ts);
  CREATE TABLE daily (date TEXT PRIMARY KEY NOT NULL, goal_ml INTEGER NOT NULL, total_ml INTEGER NOT NULL, met INTEGER NOT NULL);
  `,
];

/** The few raw operations the runner needs, so it works with expo-sqlite and better-sqlite3. */
export interface RawDb {
  exec(sql: string): void;
  getUserVersion(): number;
  setUserVersion(v: number): void;
}

/** Applies pending migrations in a transaction each. Returns the resulting version. */
export function migrate(raw: RawDb): number {
  let version = raw.getUserVersion();
  for (let i = version; i < MIGRATIONS.length; i++) {
    raw.exec('BEGIN');
    try {
      raw.exec(MIGRATIONS[i]!);
      raw.setUserVersion(i + 1);
      raw.exec('COMMIT');
    } catch (e) {
      raw.exec('ROLLBACK');
      throw e;
    }
    version = i + 1;
  }
  return version;
}
