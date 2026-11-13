import { describe, expect, it } from '@jest/globals';

import { pacedInterval, planReminders } from '../plan';

const at = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
const hhmm = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate()}/${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

describe('planReminders', () => {
  const base = {
    wakeTime: '07:00',
    sleepTime: '23:00',
    intervalMin: 120,
    goalMetToday: false,
    days: 2,
  };

  it('only schedules between wake and sleep, from now on', () => {
    const r = planReminders({ ...base, now: at(2026, 11, 8, 6) }).map(hhmm);
    expect(r.slice(0, 8)).toEqual([
      '8/07:00',
      '8/09:00',
      '8/11:00',
      '8/13:00',
      '8/15:00',
      '8/17:00',
      '8/19:00',
      '8/21:00',
    ]);
    expect(r).not.toContain('8/23:00');
    expect(r[8]).toBe('9/07:00');
    expect(r).toHaveLength(16);
  });

  it('skips times already passed today', () => {
    const r = planReminders({ ...base, now: at(2026, 11, 8, 14, 30) }).map(hhmm);
    expect(r[0]).toBe('8/15:00');
  });

  it('pauses the rest of today once the goal is met, and resumes next morning', () => {
    const r = planReminders({ ...base, now: at(2026, 11, 8, 10), goalMetToday: true }).map(hhmm);
    expect(r[0]).toBe('9/07:00');
    expect(r.some((t) => t.startsWith('8/'))).toBe(false);
  });

  it('supports each interval (30/60/90/120)', () => {
    for (const intervalMin of [30, 60, 90, 120]) {
      const r = planReminders({ ...base, intervalMin, days: 1, now: at(2026, 11, 8, 0) });
      expect(r).toHaveLength(Math.ceil((16 * 60) / intervalMin));
      expect(r[1]! - r[0]!).toBe(intervalMin * 60_000);
    }
  });

  it('handles a window that crosses midnight (wake 20:00, sleep 04:00)', () => {
    const r = planReminders({
      wakeTime: '20:00',
      sleepTime: '04:00',
      intervalMin: 120,
      goalMetToday: false,
      days: 1,
      now: at(2026, 11, 8, 1),
    }).map(hhmm);
    // Still inside last night's window at 01:00
    expect(r).toEqual(['8/02:00', '8/20:00', '8/22:00', '9/00:00', '9/02:00']);
  });

  it('keeps wall-clock times across DST (TZ=America/New_York)', () => {
    const r = planReminders({ ...base, intervalMin: 60, days: 1, now: at(2026, 3, 8, 0) }).map(
      hhmm,
    );
    expect(r[0]).toBe('8/07:00');
    expect(r).toContain('8/22:00');
  });

  it('returns nothing when the window has ended and days = 1', () => {
    expect(planReminders({ ...base, days: 1, now: at(2026, 11, 8, 23, 30) })).toEqual([]);
  });

  describe('premium hooks', () => {
    it('drops reminders inside quiet hours', () => {
      const r = planReminders({
        ...base,
        intervalMin: 60,
        days: 1,
        now: at(2026, 11, 8, 0),
        quietHours: [{ start: '12:00', end: '14:00' }],
      }).map(hhmm);
      expect(r).not.toContain('8/12:00');
      expect(r).not.toContain('8/13:00');
      expect(r).toContain('8/14:00');
    });

    it('smart pacing shortens the gap when behind, never below half', () => {
      const dayStart = at(2026, 11, 8);
      const noon = at(2026, 11, 8, 15); // half the 07–23 window has passed
      expect(pacedInterval(60, 420, 1380, noon, dayStart, 0.5)).toBe(60);
      expect(pacedInterval(60, 420, 1380, noon, dayStart, 0.25)).toBe(45);
      expect(pacedInterval(60, 420, 1380, noon, dayStart, 0)).toBe(30);
      expect(pacedInterval(60, 420, 1380, noon, dayStart, 0.9)).toBe(60);
    });
  });
});
