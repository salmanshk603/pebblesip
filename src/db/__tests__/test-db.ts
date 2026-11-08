import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { migrate } from '../migrations';
import * as schema from '../schema';
import { seed } from '../seed';
import type { DB } from '../types';

/** Fresh in-memory database with the real migrations and seed. */
export function createTestDb(): { db: DB; raw: Database.Database } {
  const raw = new Database(':memory:');
  raw.pragma('foreign_keys = ON');
  migrate({
    exec: (sql) => raw.exec(sql),
    getUserVersion: () => raw.pragma('user_version', { simple: true }) as number,
    setUserVersion: (v) => raw.pragma(`user_version = ${v}`),
  });
  const db = drizzle(raw, { schema }) as unknown as DB;
  seed(db);
  return { db, raw };
}
