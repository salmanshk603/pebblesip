import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';

import { DEFAULT_GOAL_ML } from '@/lib/goal';
import { addDays, dateRange, toDateKey, type DateKey } from '@/lib/dates';
import { newId } from '@/lib/id';

import {
  cups,
  daily,
  drinks,
  logs,
  settings,
  type Cup,
  type Daily,
  type Drink,
  type Log,
} from './schema';
import { WATER_ID } from './seed';
import type { DB } from './types';

// ---------- settings ----------

export function getSetting(db: DB, key: string): string | undefined {
  return db.select().from(settings).where(eq(settings.key, key)).get()?.value;
}

export function setSetting(db: DB, key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

export function getGoalMl(db: DB): number {
  const v = Number(getSetting(db, 'goal_ml'));
  return Number.isFinite(v) && v > 0 ? v : DEFAULT_GOAL_ML;
}

/** Changes the goal from today on; past days keep the goal they had. */
export function setGoalMl(db: DB, goalMl: number, now: number = Date.now()): void {
  db.transaction((tx) => {
    setSetting(tx, 'goal_ml', String(goalMl));
    const today = toDateKey(now);
    const row = tx.select().from(daily).where(eq(daily.date, today)).get();
    if (row) {
      tx.update(daily)
        .set({ goalMl, met: row.totalMl >= goalMl })
        .where(eq(daily.date, today))
        .run();
    }
  });
}

// ---------- daily rollup ----------

/** Recomputes the cached `daily` row for one date from its logs. */
export function recomputeDaily(db: DB, date: DateKey): Daily {
  const totalMl =
    db
      .select({ total: sql<number>`coalesce(sum(${logs.effectiveMl}), 0)` })
      .from(logs)
      .where(eq(logs.date, date))
      .get()?.total ?? 0;
  const existing = db.select().from(daily).where(eq(daily.date, date)).get();
  const goalMl = existing?.goalMl ?? getGoalMl(db);
  const row: Daily = { date, goalMl, totalMl, met: totalMl >= goalMl };
  db.insert(daily)
    .values(row)
    .onConflictDoUpdate({ target: daily.date, set: { totalMl: row.totalMl, met: row.met } })
    .run();
  return row;
}

// ---------- logs ----------

export interface AddLogInput {
  amountMl: number;
  drinkId?: string;
  ts?: number;
}

export function addLog(
  db: DB,
  { amountMl, drinkId = WATER_ID, ts = Date.now() }: AddLogInput,
): Log {
  if (!Number.isFinite(amountMl) || amountMl <= 0) throw new Error(`Invalid amount: ${amountMl}`);
  return db.transaction((tx) => {
    const drink = tx.select().from(drinks).where(eq(drinks.id, drinkId)).get();
    if (!drink) throw new Error(`Unknown drink: ${drinkId}`);
    const log: Log = {
      id: newId(ts),
      ts,
      date: toDateKey(ts),
      amountMl: Math.round(amountMl),
      drinkId,
      effectiveMl: Math.round(amountMl * drink.factor),
    };
    tx.insert(logs).values(log).run();
    recomputeDaily(tx, log.date);
    return log;
  });
}

export function deleteLog(db: DB, id: string): Log | undefined {
  return db.transaction((tx) => {
    const log = tx.select().from(logs).where(eq(logs.id, id)).get();
    if (!log) return undefined;
    tx.delete(logs).where(eq(logs.id, id)).run();
    recomputeDaily(tx, log.date);
    return log;
  });
}

/** Removes the most recent entry (by time). Returns it, or undefined if there are none. */
export function undoLastLog(db: DB): Log | undefined {
  const last = db.select().from(logs).orderBy(desc(logs.ts)).limit(1).get();
  return last ? deleteLog(db, last.id) : undefined;
}

// ---------- reads ----------

export interface Today {
  date: DateKey;
  goalMl: number;
  totalMl: number;
  met: boolean;
  /** 0–100, capped. */
  percent: number;
  /** Newest first. */
  logs: Log[];
}

export function getToday(db: DB, now: number = Date.now()): Today {
  const date = toDateKey(now);
  const row = db.select().from(daily).where(eq(daily.date, date)).get();
  const goalMl = row?.goalMl ?? getGoalMl(db);
  const totalMl = row?.totalMl ?? 0;
  const todayLogs = db.select().from(logs).where(eq(logs.date, date)).orderBy(desc(logs.ts)).all();
  return {
    date,
    goalMl,
    totalMl,
    met: totalMl >= goalMl,
    percent: Math.min(100, Math.round((totalMl / goalMl) * 100)),
    logs: todayLogs,
  };
}

/** One row per day in [from, to]; days without logs come back as 0 ml, not met. */
export function getRange(db: DB, from: DateKey, to: DateKey): Daily[] {
  const rows = db
    .select()
    .from(daily)
    .where(and(gte(daily.date, from), lte(daily.date, to)))
    .orderBy(asc(daily.date))
    .all();
  const byDate = new Map(rows.map((r) => [r.date, r]));
  const fallbackGoal = getGoalMl(db);
  return dateRange(from, to).map(
    (date) => byDate.get(date) ?? { date, goalMl: fallbackGoal, totalMl: 0, met: false },
  );
}

/**
 * Consecutive days with the goal met, ending today. If today isn't met yet the streak
 * is still alive and counts back from yesterday.
 */
export function getStreak(db: DB, now: number = Date.now()): number {
  const metDates = new Set(
    db
      .select({ date: daily.date })
      .from(daily)
      .where(eq(daily.met, true))
      .all()
      .map((r) => r.date),
  );
  let day = toDateKey(now);
  if (!metDates.has(day)) day = addDays(day, -1);
  let streak = 0;
  while (metDates.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function getCups(db: DB): Cup[] {
  return db.select().from(cups).orderBy(asc(cups.sortOrder)).all();
}

export function getDrinks(db: DB): Drink[] {
  return db.select().from(drinks).all();
}

const CELEBRATED_KEY = 'celebrated_date';

/**
 * True exactly once per day: the first time it's called after today's goal is met.
 * Undoing below the goal and logging again does not celebrate twice.
 */
export function claimGoalCelebration(db: DB, now: number = Date.now()): boolean {
  const today = getToday(db, now);
  if (!today.met || getSetting(db, CELEBRATED_KEY) === today.date) return false;
  setSetting(db, CELEBRATED_KEY, today.date);
  return true;
}
