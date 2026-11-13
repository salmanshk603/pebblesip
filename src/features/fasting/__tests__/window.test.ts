import { describe, expect, it } from '@jest/globals';

import { planReminders } from '@/features/reminders/plan';

import {
  CITIES,
  eatingWindow,
  type FastingConfig,
  perReminderMl,
  ramadanWindow,
  suhoorTimes,
  windowMinutes,
} from '../window';

const NY = CITIES.find((c) => c.label.startsWith('New York'))!;
const cfg: FastingConfig = {
  enabled: true,
  mode: 'manual',
  start: '18:30',
  end: '04:30',
  preset: '16:8',
  place: NY,
  method: 'NorthAmerica',
  suhoorPlan: true,
};
const now = new Date(2026, 2, 1, 12, 0); // 1 Mar 2026, noon (TZ America/New_York)
const hhmm = (ts: number) => {
  const d = new Date(ts);
  return `${d.getDate()}/${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

describe('eatingWindow', () => {
  it('is null when fasting is off', () => {
    expect(eatingWindow({ ...cfg, enabled: false }, true, now)).toBeNull();
  });

  it('uses the manual window', () => {
    expect(eatingWindow(cfg, false, now)).toEqual({ start: '18:30', end: '04:30' });
  });

  it('IF presets set the window from the start time (Premium)', () => {
    const w = (preset: FastingConfig['preset']) =>
      eatingWindow({ ...cfg, mode: 'if', start: '12:00', preset }, true, now);
    expect(w('16:8')).toEqual({ start: '12:00', end: '20:00' });
    expect(w('18:6')).toEqual({ start: '12:00', end: '18:00' });
    expect(w('20:4')).toEqual({ start: '12:00', end: '16:00' });
    expect(w('OMAD')).toEqual({ start: '12:00', end: '13:00' });
  });

  it('Premium modes fall back to the manual window without Premium', () => {
    expect(eatingWindow({ ...cfg, mode: 'if' }, false, now)).toEqual({
      start: '18:30',
      end: '04:30',
    });
    expect(eatingWindow({ ...cfg, mode: 'ramadan' }, false, now)?.start).toBe('18:30');
  });

  it('Ramadan without a place falls back to manual', () => {
    expect(eatingWindow({ ...cfg, mode: 'ramadan', place: null }, true, now)?.start).toBe('18:30');
  });

  it('Ramadan window is Maghrib to next-day Fajr', () => {
    const w = ramadanWindow(NY, now, 'NorthAmerica');
    // NYC, 1 Mar 2026: sunset ≈ 17:50 EST; Fajr (ISNA 15°) ≈ 05:15 EST
    expect(w.start >= '17:40' && w.start <= '18:00').toBe(true);
    expect(w.end >= '05:00' && w.end <= '05:30').toBe(true);
    expect(eatingWindow({ ...cfg, mode: 'ramadan' }, true, now)).toEqual(w);
  });
});

describe('goal spread', () => {
  it('splits the goal over the window slots', () => {
    const w = { start: '18:30', end: '04:30' };
    expect(windowMinutes(w)).toBe(600);
    expect(perReminderMl(2500, w, 60)).toBe(250);
    expect(perReminderMl(2300, { start: '18:42', end: '04:51' }, 60)).toBe(210);
  });
});

describe('reminders inside a midnight-crossing window', () => {
  it('only fires between 18:30 and 04:30', () => {
    const r = planReminders({
      now: now.getTime(),
      wakeTime: '18:30',
      sleepTime: '04:30',
      intervalMin: 120,
      goalMetToday: false,
      days: 1,
    }).map(hhmm);
    expect(r).toEqual(['1/18:30', '1/20:30', '1/22:30', '2/00:30', '2/02:30']);
  });
});

describe('suhoorTimes', () => {
  it('schedules two reminders before each Fajr', () => {
    const t = suhoorTimes(NY, 'NorthAmerica', now.getTime(), 1);
    expect(t.map(hhmm)).toHaveLength(2); // today's Fajr has passed; tomorrow's two remain
    expect(t[1]! - t[0]!).toBe(15 * 60_000);
  });
});
