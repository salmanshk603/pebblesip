import { getCups, getSetting, getToday, setSetting } from '@/db/queries';
import type { DB } from '@/db/types';
import { KEYS as ONBOARDING_KEYS } from '@/features/onboarding/onboarding';
import type { VolumeUnit } from '@/lib/units';

import {
  ACCENT_COLORS,
  resolveTheme,
  WIDGET_THEME_IDS,
  type WidgetTheme,
  type WidgetThemeId,
} from './themes';

export const WIDGET_KEYS = {
  theme: 'widget_theme',
  accent: 'widget_accent',
  trial: 'widget_theme_trial',
} as const;
export const TRIAL_MS = 24 * 60 * 60 * 1000;

/** A Premium theme unlocked for 24 h by a rewarded ad. */
export interface ThemeTrial {
  theme: WidgetThemeId;
  until: number;
}

export function getThemeTrial(db: DB, now = Date.now()): ThemeTrial | null {
  try {
    const t = JSON.parse(getSetting(db, WIDGET_KEYS.trial) ?? 'null') as ThemeTrial | null;
    if (!t || !(WIDGET_THEME_IDS as readonly string[]).includes(t.theme)) return null;
    return t.until > now ? t : null;
  } catch {
    return null;
  }
}

export function startThemeTrial(db: DB, theme: WidgetThemeId, now = Date.now()): ThemeTrial {
  const t = { theme, until: now + TRIAL_MS };
  setSetting(db, WIDGET_KEYS.trial, JSON.stringify(t));
  return t;
}

export interface WidgetPrefs {
  theme: WidgetThemeId;
  accent: string | null;
}

export function getWidgetPrefs(db: DB): WidgetPrefs {
  const t = getSetting(db, WIDGET_KEYS.theme);
  const a = getSetting(db, WIDGET_KEYS.accent);
  return {
    theme: (WIDGET_THEME_IDS as readonly string[]).includes(t ?? '')
      ? (t as WidgetThemeId)
      : 'aqua',
    accent: a && (ACCENT_COLORS as readonly string[]).includes(a) ? a : null,
  };
}

export function setWidgetPrefs(db: DB, p: WidgetPrefs): void {
  setSetting(db, WIDGET_KEYS.theme, p.theme);
  setSetting(db, WIDGET_KEYS.accent, p.accent ?? '');
}

/** Everything a widget needs to draw itself; read fresh from SQLite on every render. */
export interface WidgetData {
  totalMl: number;
  goalMl: number;
  /** 0–100, capped. */
  pct: number;
  unit: VolumeUnit;
  /** Time of the last drink today, or null. */
  lastTs: number | null;
  theme: WidgetTheme;
  /** Quick-add amounts for the medium widget (the user's first three cups). */
  cupsMl: number[];
}

export function getWidgetData(db: DB, premium: boolean, now = Date.now()): WidgetData {
  const today = getToday(db, now);
  const prefs = getWidgetPrefs(db);
  const lastTs = today.logs.reduce<number | null>(
    (m, l) => (m === null || l.ts > m ? l.ts : m),
    null,
  );
  return {
    totalMl: today.totalMl,
    goalMl: today.goalMl,
    pct: today.goalMl > 0 ? Math.min(100, Math.round((today.totalMl / today.goalMl) * 100)) : 0,
    unit: getSetting(db, ONBOARDING_KEYS.volumeUnit) === 'oz' ? 'oz' : 'ml',
    lastTs,
    // A rewarded-ad trial unlocks that one theme (no accent) until it expires.
    theme:
      !premium && getThemeTrial(db, now)?.theme === prefs.theme
        ? resolveTheme(prefs.theme, null, true)
        : resolveTheme(prefs.theme, prefs.accent, premium),
    cupsMl: getCups(db)
      .slice(0, 3)
      .map((c) => c.amountMl),
  };
}
