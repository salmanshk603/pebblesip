import { CalculationMethod, Coordinates, PrayerTimes } from 'adhan';

import { toMinutes } from '@/features/reminders/plan';

/** Pure fasting-window maths: no DB, no native modules. */

export type FastingMode = 'manual' | 'if' | 'ramadan';

export const IF_PRESETS = ['16:8', '18:6', '20:4', 'OMAD'] as const;
export type IfPreset = (typeof IF_PRESETS)[number];
/** Eating hours per preset. OMAD = one meal, a 1-hour window. */
export const IF_EATING_HOURS: Record<IfPreset, number> = {
  '16:8': 8,
  '18:6': 6,
  '20:4': 4,
  OMAD: 1,
};

export const CALC_METHODS = {
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority',
  Karachi: 'University of Islamic Sciences, Karachi',
  UmmAlQura: 'Umm al-Qura, Makkah',
  Dubai: 'Dubai',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  MoonsightingCommittee: 'Moonsighting Committee',
  NorthAmerica: 'ISNA (North America)',
  Singapore: 'Singapore',
  Turkey: 'Diyanet, Turkey',
  Tehran: 'Tehran',
} as const;
export type CalcMethod = keyof typeof CALC_METHODS;

export interface Place {
  label: string;
  lat: number;
  lng: number;
}

/** Manual city list, so Ramadan mode works with location denied. */
export const CITIES: Place[] = [
  { label: 'Mumbai, India', lat: 19.076, lng: 72.8777 },
  { label: 'Delhi, India', lat: 28.6139, lng: 77.209 },
  { label: 'Hyderabad, India', lat: 17.385, lng: 78.4867 },
  { label: 'Karachi, Pakistan', lat: 24.8607, lng: 67.0011 },
  { label: 'Lahore, Pakistan', lat: 31.5204, lng: 74.3587 },
  { label: 'Dhaka, Bangladesh', lat: 23.8103, lng: 90.4125 },
  { label: 'Jakarta, Indonesia', lat: -6.2088, lng: 106.8456 },
  { label: 'Kuala Lumpur, Malaysia', lat: 3.139, lng: 101.6869 },
  { label: 'Riyadh, Saudi Arabia', lat: 24.7136, lng: 46.6753 },
  { label: 'Makkah, Saudi Arabia', lat: 21.3891, lng: 39.8579 },
  { label: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  { label: 'Cairo, Egypt', lat: 30.0444, lng: 31.2357 },
  { label: 'Istanbul, Türkiye', lat: 41.0082, lng: 28.9784 },
  { label: 'London, UK', lat: 51.5074, lng: -0.1278 },
  { label: 'New York, USA', lat: 40.7128, lng: -74.006 },
  { label: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
];

export interface FastingConfig {
  enabled: boolean;
  mode: FastingMode;
  /** Manual eating window "HH:MM". Also the start time for IF presets. */
  start: string;
  end: string;
  preset: IfPreset;
  place: Place | null;
  method: CalcMethod;
  suhoorPlan: boolean;
}

export interface EatingWindow {
  start: string;
  end: string;
}

export const pad = (n: number) => String(n).padStart(2, '0');
export const fmtHHMM = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function addHours(hhmm: string, hours: number): string {
  const m = (toMinutes(hhmm) + hours * 60) % (24 * 60);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function prayerTimes(place: Place, date: Date, method: CalcMethod) {
  const params = CalculationMethod[method]();
  return new PrayerTimes(new Coordinates(place.lat, place.lng), date, params);
}

/** Ramadan window for the night starting on `date`: Maghrib that day → Fajr the next day. */
export function ramadanWindow(place: Place, date: Date, method: CalcMethod): EatingWindow {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return {
    start: fmtHHMM(prayerTimes(place, date, method).maghrib),
    end: fmtHHMM(prayerTimes(place, next, method).fajr),
  };
}

/** Modes that need Premium; without it they fall back to the manual window. */
export function effectiveMode(c: FastingConfig, premium: boolean): FastingMode {
  if (c.mode === 'manual' || premium) {
    return c.mode === 'ramadan' && !c.place ? 'manual' : c.mode;
  }
  return 'manual';
}

/** The eating window reminders should use, or null when fasting mode is off. */
export function eatingWindow(c: FastingConfig, premium: boolean, now: Date): EatingWindow | null {
  if (!c.enabled) return null;
  switch (effectiveMode(c, premium)) {
    case 'if':
      return { start: c.start, end: addHours(c.start, IF_EATING_HOURS[c.preset]) };
    case 'ramadan':
      return ramadanWindow(c.place!, now, c.method);
    default:
      return { start: c.start, end: c.end };
  }
}

/** Window length in minutes; an end at or before the start crosses midnight. */
export function windowMinutes(w: EatingWindow): number {
  const s = toMinutes(w.start);
  let e = toMinutes(w.end);
  if (e <= s) e += 24 * 60;
  return e - s;
}

/** Goal spread across the window: one reminder per interval, the goal split evenly (to 10 ml). */
export function perReminderMl(goalMl: number, w: EatingWindow, intervalMin: number): number {
  const slots = Math.max(1, Math.ceil(windowMinutes(w) / intervalMin));
  return Math.max(10, Math.round(goalMl / slots / 10) * 10);
}

/** Suhoor plan: two "glass before Fajr" reminders, 30 and 15 minutes before each Fajr. */
export const SUHOOR_OFFSETS_MIN = [30, 15] as const;

export function suhoorTimes(place: Place, method: CalcMethod, now: number, days: number): number[] {
  const out: number[] = [];
  for (let d = 0; d <= days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const fajr = prayerTimes(place, date, method).fajr.getTime();
    for (const off of SUHOOR_OFFSETS_MIN) {
      const ts = fajr - off * 60_000;
      if (ts > now) out.push(ts);
    }
  }
  return out.sort((a, b) => a - b);
}
