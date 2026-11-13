import type { Daily } from '@/db/schema';
import { addDays, type DateKey, fromDateKey } from '@/lib/dates';

/** Pure stats maths over `daily` rows (one row per calendar day, gaps filled by getRange). */

export interface Bar {
  key: string;
  /** Short label under the bar: "Mon", "14", "Jan". */
  label: string;
  totalMl: number;
  goalMl: number;
  met: boolean;
  isCurrent: boolean;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Day bars for a run of daily rows (7 for Week, 30 for Month). The last row is today. */
export function dayBars(rows: Daily[], today: DateKey, labelStyle: 'weekday' | 'date'): Bar[] {
  return rows.map((r) => {
    const d = fromDateKey(r.date);
    return {
      key: r.date,
      label: labelStyle === 'weekday' ? WEEKDAYS[d.getDay()]! : String(d.getDate()),
      totalMl: r.totalMl,
      goalMl: r.goalMl,
      met: r.met,
      isCurrent: r.date === today,
    };
  });
}

/** 12 month bars ending with the current month: average daily intake over the days so far. */
export function monthBars(rows: Daily[], today: DateKey): Bar[] {
  const byMonth = new Map<string, Daily[]>();
  for (const r of rows) {
    if (r.date > today) continue;
    const k = r.date.slice(0, 7);
    byMonth.set(k, [...(byMonth.get(k) ?? []), r]);
  }
  const t = fromDateKey(today);
  const out: Bar[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(t.getFullYear(), t.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const days = byMonth.get(k) ?? [];
    const avg = (f: (r: Daily) => number) =>
      days.length ? Math.round(days.reduce((s, r) => s + f(r), 0) / days.length) : 0;
    const goal = avg((r) => r.goalMl);
    const total = avg((r) => r.totalMl);
    out.push({
      key: k,
      label: MONTHS[d.getMonth()]!,
      totalMl: total,
      goalMl: goal,
      met: goal > 0 && total >= goal,
      isCurrent: i === 0,
    });
  }
  return out;
}

export interface Summary {
  avgMl: number;
  met: number;
  days: number;
  /** 0–100 */
  successRate: number;
}

export function summarize(rows: Daily[]): Summary {
  const days = rows.length;
  const met = rows.filter((r) => r.met).length;
  return {
    avgMl: days ? Math.round(rows.reduce((s, r) => s + r.totalMl, 0) / days) : 0,
    met,
    days,
    successRate: days ? Math.round((met / days) * 100) : 0,
  };
}

/** % change of average intake vs the previous period; null when there's nothing to compare. */
export function changePct(current: Daily[], previous: Daily[]): number | null {
  const prev = summarize(previous).avgMl;
  if (!prev) return null;
  return Math.round(((summarize(current).avgMl - prev) / prev) * 100);
}

/** Longest run of consecutive goal-met days ever. */
export function bestStreak(metDates: DateKey[]): number {
  const sorted = [...new Set(metDates)].sort();
  let best = 0;
  let run = 0;
  let prev: DateKey | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export type HeatLevel = 'empty' | 'low' | 'mid' | 'met' | 'future';

/** Calendar heatmap cell level for a day. */
export function heatLevel(r: Daily | undefined, date: DateKey, today: DateKey): HeatLevel {
  if (date > today) return 'future';
  if (!r || r.totalMl <= 0) return 'empty';
  if (r.met) return 'met';
  return r.totalMl / r.goalMl >= 0.5 ? 'mid' : 'low';
}

/** Monday-first grid of a month: leading nulls pad to the first weekday. */
export function monthGrid(year: number, month0: number): (DateKey | null)[] {
  const first = new Date(year, month0, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month0 + 1, 0).getDate();
  const cells: (DateKey | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) {
    cells.push(`${year}-${String(month0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return cells;
}

/** CSV of daily totals, oldest first. Always ml (unit-neutral, spreadsheet-friendly). */
export function toCsv(rows: Daily[]): string {
  const lines = ['date,total_ml,goal_ml,goal_met'];
  for (const r of rows) lines.push(`${r.date},${r.totalMl},${r.goalMl},${r.met ? 'yes' : 'no'}`);
  return lines.join('\n') + '\n';
}
