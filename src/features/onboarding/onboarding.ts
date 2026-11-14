import { getSetting, setGoalMl, setSetting } from '@/db/queries';
import type { DB } from '@/db/types';
import { calcGoalMl, GOAL_MAX_ML, GOAL_MIN_ML, type ActivityLevel, type Climate } from '@/lib/goal';
import type { VolumeUnit } from '@/lib/units';

export type WeightUnit = 'kg' | 'lb';

export interface OnboardingDraft {
  weightKg: number;
  weightUnit: WeightUnit;
  activity: ActivityLevel;
  climate: Climate;
  /** "HH:MM", 24h local time */
  wakeTime: string;
  sleepTime: string;
  volumeUnit: VolumeUnit;
  /** Set when the user edits the suggested goal; otherwise the formula is used. */
  goalOverrideMl?: number;
}

export const DEFAULT_DRAFT: OnboardingDraft = {
  weightKg: 70,
  weightUnit: 'kg',
  activity: 'moderate',
  climate: 'mild',
  wakeTime: '07:00',
  sleepTime: '23:00',
  volumeUnit: 'ml',
};

export const KEYS = {
  complete: 'onboarding_complete',
  weightKg: 'weight_kg',
  weightUnit: 'weight_unit',
  activity: 'activity',
  climate: 'climate',
  wakeTime: 'wake_time',
  sleepTime: 'sleep_time',
  volumeUnit: 'volume_unit',
  /** '1' when the user set the goal by hand; otherwise it follows the formula. */
  goalManual: 'goal_manual',
} as const;

export function suggestedGoalMl(d: OnboardingDraft): number {
  return calcGoalMl(d.weightKg, d.activity, d.climate);
}

export function finalGoalMl(d: OnboardingDraft): number {
  const g = d.goalOverrideMl ?? suggestedGoalMl(d);
  return Math.min(GOAL_MAX_ML, Math.max(GOAL_MIN_ML, Math.round(g)));
}

/** The formula goal from the stored profile (Settings → Daily goal → Auto). */
export function storedSuggestedGoalMl(db: DB): number {
  const w = Number(getSetting(db, KEYS.weightKg));
  return calcGoalMl(
    Number.isFinite(w) && w > 0 ? w : DEFAULT_DRAFT.weightKg,
    (getSetting(db, KEYS.activity) as ActivityLevel | undefined) ?? DEFAULT_DRAFT.activity,
    (getSetting(db, KEYS.climate) as Climate | undefined) ?? DEFAULT_DRAFT.climate,
  );
}

export function isOnboardingComplete(db: DB): boolean {
  return getSetting(db, KEYS.complete) === '1';
}

/** Persists the profile and goal, then marks onboarding done (one transaction). */
export function completeOnboarding(db: DB, d: OnboardingDraft, now: number = Date.now()): number {
  const goal = finalGoalMl(d);
  db.transaction((tx) => {
    setSetting(tx, KEYS.weightKg, String(Math.round(d.weightKg * 10) / 10));
    setSetting(tx, KEYS.weightUnit, d.weightUnit);
    setSetting(tx, KEYS.activity, d.activity);
    setSetting(tx, KEYS.climate, d.climate);
    setSetting(tx, KEYS.wakeTime, d.wakeTime);
    setSetting(tx, KEYS.sleepTime, d.sleepTime);
    setSetting(tx, KEYS.volumeUnit, d.volumeUnit);
    setGoalMl(tx, goal, now);
    setSetting(tx, KEYS.goalManual, d.goalOverrideMl !== undefined ? '1' : '0');
    setSetting(tx, KEYS.complete, '1');
  });
  return goal;
}

// ---- time helpers ("HH:MM") ----
export function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map(Number);
  return { h: h ?? 0, m: m ?? 0 };
}

export function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** "07:00" → { time: "7:00", period: "AM" } for display. */
export function to12h(t: string): { time: string; period: 'AM' | 'PM' } {
  const { h, m } = parseTime(t);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { time: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, period };
}
