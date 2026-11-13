import { addDays, fromDateKey, toDateKey } from '@/lib/dates';

export const REMINDER_INTERVALS = [30, 60, 90, 120] as const;
export type ReminderInterval = (typeof REMINDER_INTERVALS)[number];
export const DEFAULT_INTERVAL: ReminderInterval = 60;
/** How many calendar days ahead to keep scheduled. Rescheduled on app start and every log. */
export const DAYS_AHEAD = 3;

/** 30 → "30 min", 90 → "1 h 30 min". */
export function intervalLabel(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** Minutes since midnight, e.g. "07:30" → 450. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export interface QuietHours {
  /** "HH:MM" */
  start: string;
  end: string;
}

export interface PlanInput {
  now: number;
  wakeTime: string;
  sleepTime: string;
  intervalMin: number;
  /** Today's goal already met: skip the rest of today (auto-pause). */
  goalMetToday: boolean;
  days?: number;
  // ---- Premium hooks (only passed when the feature flag and Premium are on) ----
  quietHours?: QuietHours[];
  /** 0–1 share of today's goal logged. With pacing on, today's gaps shrink when behind. */
  progressToday?: number;
  smartPacing?: boolean;
}

/**
 * Reminder times (epoch ms) from now on. A day's window runs from wake to sleep; if
 * sleep is not after wake (e.g. 20:00 → 04:00) the window runs past midnight.
 * The first reminder is at wake time; none at or after sleep time.
 */
export function planReminders(input: PlanInput): number[] {
  const { now, intervalMin, goalMetToday, days = DAYS_AHEAD } = input;
  const wake = toMinutes(input.wakeTime);
  let sleep = toMinutes(input.sleepTime);
  if (sleep <= wake) sleep += 24 * 60;
  const today = toDateKey(now);
  const out: number[] = [];

  // Start one day back so an overnight window that began yesterday is included.
  for (let d = -1; d < days; d++) {
    const dayKey = addDays(today, d);
    const base = fromDateKey(dayKey);
    const isToday = d === 0 || (d === -1 && sleep > 24 * 60);
    let step = intervalMin;
    if (input.smartPacing && isToday && input.progressToday !== undefined) {
      step = pacedInterval(intervalMin, wake, sleep, now, base.getTime(), input.progressToday);
    }
    for (let m = wake; m < sleep; m += step) {
      const t = new Date(base);
      t.setMinutes(t.getMinutes() + m); // calendar-aware, DST-safe
      const ts = t.getTime();
      if (ts <= now) continue;
      if (goalMetToday && toDateKey(ts) === today) continue;
      if (input.quietHours?.some((q) => inQuietHours(ts, q))) continue;
      out.push(ts);
    }
  }
  return [...new Set(out)].sort((a, b) => a - b);
}

function inQuietHours(ts: number, q: QuietHours): boolean {
  const d = new Date(ts);
  const m = d.getHours() * 60 + d.getMinutes();
  const s = toMinutes(q.start);
  const e = toMinutes(q.end);
  return s <= e ? m >= s && m < e : m >= s || m < e;
}

/**
 * Premium smart pacing: if logged progress is behind the share of the waking window
 * that has passed, shorten today's interval (down to half). Never lengthens it.
 */
export function pacedInterval(
  intervalMin: number,
  wake: number,
  sleep: number,
  now: number,
  dayStart: number,
  progress: number,
): number {
  const minutesNow = (now - dayStart) / 60_000;
  const elapsed = Math.min(1, Math.max(0, (minutesNow - wake) / (sleep - wake)));
  const behind = Math.max(0, elapsed - progress);
  return Math.max(Math.round(intervalMin / 2), Math.round(intervalMin * (1 - behind)));
}
