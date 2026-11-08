import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// prd.md §9 data model. Keep in sync with migrations.ts.
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const drinks = sqliteTable('drinks', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  factor: real('factor').notNull().default(1),
  icon: text('icon').notNull(),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  premium: integer('premium', { mode: 'boolean' }).notNull().default(false),
});

export const cups = sqliteTable('cups', {
  id: text('id').primaryKey(),
  amountMl: integer('amount_ml').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  ts: integer('ts').notNull(),
  date: text('date').notNull(),
  amountMl: integer('amount_ml').notNull(),
  drinkId: text('drink_id').notNull(),
  effectiveMl: integer('effective_ml').notNull(),
});

export const daily = sqliteTable('daily', {
  date: text('date').primaryKey(),
  goalMl: integer('goal_ml').notNull(),
  totalMl: integer('total_ml').notNull(),
  met: integer('met', { mode: 'boolean' }).notNull(),
});

export type Log = typeof logs.$inferSelect;
export type Daily = typeof daily.$inferSelect;
export type Drink = typeof drinks.$inferSelect;
export type Cup = typeof cups.$inferSelect;
