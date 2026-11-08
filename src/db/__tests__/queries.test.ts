import { describe, expect, it } from '@jest/globals';
import { eq } from 'drizzle-orm';

import {
  addLog,
  claimGoalCelebration,
  deleteLog,
  getGoalMl,
  getRange,
  getStreak,
  getToday,
  recomputeDaily,
  setGoalMl,
  undoLastLog,
} from '../queries';
import { cups, daily, drinks } from '../schema';
import { seed } from '../seed';
import { DEFAULT_GOAL_ML } from '@/lib/goal';
import { MIGRATIONS } from '../migrations';
import { createTestDb } from './test-db';

const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

describe('migrations + seed', () => {
  it('creates the schema at the latest version and seeds defaults', () => {
    const { db, raw } = createTestDb();
    expect(raw.pragma('user_version', { simple: true })).toBe(MIGRATIONS.length);
    const all = db.select().from(drinks).all();
    expect(all).toHaveLength(7);
    expect(all.filter((d) => !d.premium).map((d) => d.id)).toEqual(['water']);
    expect(all.find((d) => d.id === 'coffee')?.factor).toBe(0.8);
    expect(
      db
        .select()
        .from(cups)
        .all()
        .map((c) => c.amountMl),
    ).toEqual([150, 250, 500]);
  });

  it('seed updates built-in drinks from older versions', () => {
    const { db } = createTestDb();
    db.update(drinks).set({ icon: 'water_drop' }).where(eq(drinks.id, 'water')).run();
    seed(db);
    expect(db.select().from(drinks).where(eq(drinks.id, 'water')).get()?.icon).toBe('water');
  });

  it('seed is idempotent', () => {
    const { db } = createTestDb();
    seed(db);
    seed(db);
    expect(db.select().from(cups).all()).toHaveLength(3);
    expect(db.select().from(drinks).all()).toHaveLength(7);
  });
});

describe('logging', () => {
  it('adds logs and rolls up today', () => {
    const { db } = createTestDb();
    const now = at(2026, 11, 8, 15);
    addLog(db, { amountMl: 250, ts: at(2026, 11, 8, 9) });
    addLog(db, { amountMl: 500, ts: at(2026, 11, 8, 11) });
    const t = getToday(db, now);
    expect(t).toMatchObject({
      date: '2026-11-08',
      goalMl: DEFAULT_GOAL_ML,
      totalMl: 750,
      met: false,
      percent: 38,
    });
    expect(t.logs.map((l) => l.amountMl)).toEqual([500, 250]); // newest first
  });

  it('applies the drink hydration factor to effective_ml', () => {
    const { db } = createTestDb();
    const log = addLog(db, { amountMl: 250, drinkId: 'coffee', ts: at(2026, 11, 8) });
    expect(log.effectiveMl).toBe(200);
    expect(getToday(db, at(2026, 11, 8)).totalMl).toBe(200);
  });

  it('rejects bad input', () => {
    const { db } = createTestDb();
    expect(() => addLog(db, { amountMl: 0 })).toThrow();
    expect(() => addLog(db, { amountMl: -5 })).toThrow();
    expect(() => addLog(db, { amountMl: 250, drinkId: 'nope' })).toThrow('Unknown drink');
  });

  it('undo removes the most recent log and updates the rollup', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 250, ts: at(2026, 11, 8, 9) });
    const last = addLog(db, { amountMl: 500, ts: at(2026, 11, 8, 10) });
    expect(undoLastLog(db)?.id).toBe(last.id);
    expect(getToday(db, at(2026, 11, 8)).totalMl).toBe(250);
    undoLastLog(db);
    expect(undoLastLog(db)).toBeUndefined();
    expect(getToday(db, at(2026, 11, 8)).totalMl).toBe(0);
  });

  it('delete removes a specific log and un-meets the day if needed', () => {
    const { db } = createTestDb();
    setGoalMl(db, 1200, at(2026, 11, 8));
    const a = addLog(db, { amountMl: 700, ts: at(2026, 11, 8, 9) });
    addLog(db, { amountMl: 600, ts: at(2026, 11, 8, 10) });
    expect(getToday(db, at(2026, 11, 8)).met).toBe(true);
    expect(deleteLog(db, a.id)?.id).toBe(a.id);
    expect(getToday(db, at(2026, 11, 8))).toMatchObject({ totalMl: 600, met: false });
    expect(deleteLog(db, 'missing')).toBeUndefined();
  });

  it('caps percent at 100', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 3000, ts: at(2026, 11, 8) });
    expect(getToday(db, at(2026, 11, 8))).toMatchObject({ percent: 100, met: true });
  });
});

describe('day boundaries', () => {
  it('splits logs at local midnight', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 250, ts: at(2026, 11, 7, 23, 59) });
    addLog(db, { amountMl: 500, ts: at(2026, 11, 8, 0, 1) });
    expect(getToday(db, at(2026, 11, 7, 23, 59)).totalMl).toBe(250);
    expect(getToday(db, at(2026, 11, 8, 8)).totalMl).toBe(500);
  });

  it('keeps a log on the day it was written even if the timezone changes later', () => {
    const { db } = createTestDb();
    const log = addLog(db, { amountMl: 250, ts: at(2026, 11, 8, 23, 30) });
    expect(log.date).toBe('2026-11-08');
    const stored = db.select().from(daily).where(eq(daily.date, '2026-11-08')).get();
    expect(stored?.totalMl).toBe(250);
  });

  it('handles DST days', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 250, ts: at(2026, 3, 8, 1, 30) }); // before spring-forward
    addLog(db, { amountMl: 250, ts: at(2026, 3, 8, 23, 30) });
    addLog(db, { amountMl: 250, ts: at(2026, 11, 1, 23, 30) }); // fall-back day
    expect(getRange(db, '2026-03-08', '2026-03-08')[0]?.totalMl).toBe(500);
    expect(getRange(db, '2026-11-01', '2026-11-02').map((d) => d.totalMl)).toEqual([250, 0]);
  });
});

describe('goal changes', () => {
  it('updates today but not past days', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 1500, ts: at(2026, 11, 7) });
    addLog(db, { amountMl: 1500, ts: at(2026, 11, 8) });
    setGoalMl(db, 1400, at(2026, 11, 8));
    expect(getGoalMl(db)).toBe(1400);
    const [yesterday, today] = getRange(db, '2026-11-07', '2026-11-08');
    expect(yesterday).toMatchObject({ goalMl: DEFAULT_GOAL_ML, met: false });
    expect(today).toMatchObject({ goalMl: 1400, met: true });
  });

  it('new days pick up the current goal', () => {
    const { db } = createTestDb();
    setGoalMl(db, 2500, at(2026, 11, 7));
    addLog(db, { amountMl: 100, ts: at(2026, 11, 9) });
    expect(getToday(db, at(2026, 11, 9)).goalMl).toBe(2500);
  });

  it('recomputeDaily is stable when nothing changed', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 800, ts: at(2026, 11, 8) });
    expect(recomputeDaily(db, '2026-11-08')).toEqual(recomputeDaily(db, '2026-11-08'));
  });
});

describe('getRange', () => {
  it('fills missing days with zeros in date order', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 300, ts: at(2026, 11, 3) });
    addLog(db, { amountMl: 2100, ts: at(2026, 11, 5) });
    expect(getRange(db, '2026-11-02', '2026-11-05')).toEqual([
      { date: '2026-11-02', goalMl: DEFAULT_GOAL_ML, totalMl: 0, met: false },
      { date: '2026-11-03', goalMl: DEFAULT_GOAL_ML, totalMl: 300, met: false },
      { date: '2026-11-04', goalMl: DEFAULT_GOAL_ML, totalMl: 0, met: false },
      { date: '2026-11-05', goalMl: DEFAULT_GOAL_ML, totalMl: 2100, met: true },
    ]);
  });
});

describe('getStreak', () => {
  const meet = (db: ReturnType<typeof createTestDb>['db'], y: number, m: number, d: number) =>
    addLog(db, { amountMl: DEFAULT_GOAL_ML, ts: at(y, m, d) });

  it('is 0 with no data', () => {
    expect(getStreak(createTestDb().db, at(2026, 11, 8))).toBe(0);
  });

  it('counts consecutive met days ending today', () => {
    const { db } = createTestDb();
    [6, 7, 8].forEach((d) => meet(db, 2026, 11, d));
    expect(getStreak(db, at(2026, 11, 8, 20))).toBe(3);
  });

  it('stays alive from yesterday while today is not met yet', () => {
    const { db } = createTestDb();
    [5, 6, 7].forEach((d) => meet(db, 2026, 11, d));
    addLog(db, { amountMl: 250, ts: at(2026, 11, 8, 9) });
    expect(getStreak(db, at(2026, 11, 8, 10))).toBe(3);
  });

  it('breaks on a missed day', () => {
    const { db } = createTestDb();
    [3, 4, 6, 7].forEach((d) => meet(db, 2026, 11, d));
    expect(getStreak(db, at(2026, 11, 7))).toBe(2);
    expect(getStreak(db, at(2026, 11, 9))).toBe(0); // missed the 8th
  });

  it('runs across month and DST boundaries', () => {
    const { db } = createTestDb();
    [
      [10, 30],
      [10, 31],
      [11, 1],
      [11, 2],
    ].forEach(([m, d]) => meet(db, 2026, m!, d!));
    expect(getStreak(db, at(2026, 11, 2))).toBe(4);
  });
});

describe('claimGoalCelebration', () => {
  it('fires once per day, only after the goal is met', () => {
    const { db } = createTestDb();
    const t = at(2026, 11, 8, 10);
    addLog(db, { amountMl: 1000, ts: t });
    expect(claimGoalCelebration(db, t)).toBe(false);
    addLog(db, { amountMl: 1000, ts: t + 1 });
    expect(claimGoalCelebration(db, t)).toBe(true);
    expect(claimGoalCelebration(db, t)).toBe(false);
    undoLastLog(db);
    addLog(db, { amountMl: 1000, ts: t + 2 });
    expect(claimGoalCelebration(db, t)).toBe(false);
  });

  it('fires again on a new day', () => {
    const { db } = createTestDb();
    addLog(db, { amountMl: 2000, ts: at(2026, 11, 8) });
    expect(claimGoalCelebration(db, at(2026, 11, 8))).toBe(true);
    addLog(db, { amountMl: 2000, ts: at(2026, 11, 9) });
    expect(claimGoalCelebration(db, at(2026, 11, 9))).toBe(true);
  });
});
