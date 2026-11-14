import { Appearance } from 'react-native';

import { getSetting, setSetting } from '@/db/queries';
import type { DB } from '@/db/types';

/** App theme choice (Settings → Appearance). Widgets have their own theme. */
export const THEMES = ['light', 'dark', 'system'] as const;
export type ThemePref = (typeof THEMES)[number];
export const THEME_KEY = 'app_theme';

export function getThemePref(db: DB): ThemePref {
  const v = getSetting(db, THEME_KEY);
  return (THEMES as readonly string[]).includes(v ?? '') ? (v as ThemePref) : 'system';
}

/** Applies the choice app-wide: `useColorScheme()` (and so `useTheme()`) follow the override. */
export function applyThemePref(pref: ThemePref): void {
  Appearance.setColorScheme(pref === 'system' ? 'unspecified' : pref);
}

export function setThemePref(db: DB, pref: ThemePref): void {
  setSetting(db, THEME_KEY, pref);
  applyThemePref(pref);
}
