import { describe, expect, it } from '@jest/globals';

import type { Daily } from '@/db/schema';

import {
  bestStreak,
  changePct,
  dayBars,
  heatLevel,
  monthBars,
  monthGrid,
  summarize,
  toCsv,
} from '../stats';

const row = (date: string, totalMl: number, goalMl = 2000): Daily => ({
  date,
  totalMl,
  goalMl,
  met: totalMl >= goalMl,
});

describe('dayBars', () => {
  it('labels weekdays and marks today', () => {
    const rows = [row('2026-11-12', 1000), row('2026-11-13', 2500)];
    const b = dayBars(rows, '2026-11-13', 'weekday');
    expect(b.map((x) => x.label)).toEqual(['Thu', 'Fri']);
    expect(b[1]).toMatchObject({ isCurrent: true, met: true, totalMl: 2500 });
  });
});

describe('monthBars', () => {
  it('averages each month over its logged days, 12 months ending now', () => {
    const rows = [row('2026-11-01', 1000), row('2026-11-02', 3000), row('2026-10-15', 2000)];
    const b = monthBars(rows, '2026-11-13');
    expect(b).toHaveLength(12);
    expect(b[0]!.label).toBe('Dec');
    expect(b[11]).toMatchObject({ label: 'Nov', totalMl: 2000, isCurrent: true });
    expect(b[10]).toMatchObject({ label: 'Oct', totalMl: 2000, met: true });
    expect(b[9]!.totalMl).toBe(0);
  });
});

describe('summary', () => {
  it('computes average, goals met and success rate', () => {
    expect(summarize([row('a', 2000), row('b', 1000), row('c', 3000)])).toEqual({
      avgMl: 2000,
      met: 2,
      days: 3,
      successRate: 67,
    });
  });
  it('compares with the previous period', () => {
    expect(changePct([row('a', 2200)], [row('b', 2000)])).toBe(10);
    expect(changePct([row('a', 2200)], [row('b', 0)])).toBeNull();
  });
});

describe('bestStreak', () => {
  it('finds the longest consecutive run, across months', () => {
    expect(bestStreak(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-03', '2026-11-04'])).toBe(
      3,
    );
    expect(bestStreak([])).toBe(0);
  });
});

describe('calendar', () => {
  it('pads a Monday-first grid', () => {
    const g = monthGrid(2026, 10); // Nov 2026 starts on a Sunday
    expect(g.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(g.filter(Boolean)).toHaveLength(30);
  });
  it('levels by progress', () => {
    const t = '2026-11-13';
    expect(heatLevel(undefined, '2026-11-01', t)).toBe('empty');
    expect(heatLevel(row('x', 500), '2026-11-01', t)).toBe('low');
    expect(heatLevel(row('x', 1200), '2026-11-01', t)).toBe('mid');
    expect(heatLevel(row('x', 2000), '2026-11-01', t)).toBe('met');
    expect(heatLevel(undefined, '2026-11-20', t)).toBe('future');
  });
});

describe('toCsv', () => {
  it('writes a header and one line per day', () => {
    expect(toCsv([row('2026-11-12', 2100)])).toBe(
      'date,total_ml,goal_ml,goal_met\n2026-11-12,2100,2000,yes\n',
    );
  });
});
