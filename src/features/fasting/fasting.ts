import { getSetting, setSetting } from '@/db';
import type { DB } from '@/db/types';

import {
  CALC_METHODS,
  type CalcMethod,
  type FastingConfig,
  type FastingMode,
  IF_PRESETS,
  type IfPreset,
  type Place,
} from './window';

export const FASTING_KEYS = {
  enabled: 'fasting_enabled',
  mode: 'fasting_mode',
  start: 'fasting_start',
  end: 'fasting_end',
  preset: 'fasting_preset',
  place: 'fasting_place',
  method: 'fasting_method',
  suhoor: 'fasting_suhoor',
} as const;

export const FASTING_DEFAULTS: FastingConfig = {
  enabled: false,
  mode: 'manual',
  start: '18:30',
  end: '04:30',
  preset: '16:8',
  place: null,
  method: 'MuslimWorldLeague',
  suhoorPlan: true,
};

const HHMM = /^\d{2}:\d{2}$/;

function parsePlace(raw: string | null | undefined): Place | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Place;
    return typeof p.lat === 'number' && typeof p.lng === 'number' ? p : null;
  } catch {
    return null;
  }
}

export function getFastingConfig(db: DB): FastingConfig {
  const d = FASTING_DEFAULTS;
  const g = (k: string) => getSetting(db, k);
  const mode = g(FASTING_KEYS.mode);
  const preset = g(FASTING_KEYS.preset);
  const method = g(FASTING_KEYS.method);
  const start = g(FASTING_KEYS.start);
  const end = g(FASTING_KEYS.end);
  return {
    enabled: g(FASTING_KEYS.enabled) === '1',
    mode: (['manual', 'if', 'ramadan'] as string[]).includes(mode ?? '')
      ? (mode as FastingMode)
      : d.mode,
    start: start && HHMM.test(start) ? start : d.start,
    end: end && HHMM.test(end) ? end : d.end,
    preset: (IF_PRESETS as readonly string[]).includes(preset ?? '')
      ? (preset as IfPreset)
      : d.preset,
    place: parsePlace(g(FASTING_KEYS.place)),
    method: method && method in CALC_METHODS ? (method as CalcMethod) : d.method,
    suhoorPlan: g(FASTING_KEYS.suhoor) !== '0',
  };
}

export function setFastingConfig(db: DB, c: FastingConfig): void {
  setSetting(db, FASTING_KEYS.enabled, c.enabled ? '1' : '0');
  setSetting(db, FASTING_KEYS.mode, c.mode);
  setSetting(db, FASTING_KEYS.start, c.start);
  setSetting(db, FASTING_KEYS.end, c.end);
  setSetting(db, FASTING_KEYS.preset, c.preset);
  setSetting(db, FASTING_KEYS.place, c.place ? JSON.stringify(c.place) : '');
  setSetting(db, FASTING_KEYS.method, c.method);
  setSetting(db, FASTING_KEYS.suhoor, c.suhoorPlan ? '1' : '0');
}
