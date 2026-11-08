import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { migrate } from './migrations';
import * as schema from './schema';
import { seed } from './seed';
import type { DB } from './types';

const DB_NAME = 'pebblesip.db';

let instance: DB | undefined;

/** Opens the app database, runs migrations and seeds defaults. Safe to call repeatedly. */
export function getDb(): DB {
  if (instance) return instance;
  const raw = openDatabaseSync(DB_NAME);
  raw.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  migrate({
    exec: (sql) => raw.execSync(sql),
    getUserVersion: () =>
      raw.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0,
    setUserVersion: (v) => raw.execSync(`PRAGMA user_version = ${v}`),
  });
  const db = drizzle(raw, { schema });
  seed(db);
  instance = db;
  return db;
}
