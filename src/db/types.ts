import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

import type * as schema from './schema';

/** Any synchronous Drizzle SQLite db (expo-sqlite in the app, better-sqlite3 in tests). */
export type DB = BaseSQLiteDatabase<'sync', any, typeof schema>;
