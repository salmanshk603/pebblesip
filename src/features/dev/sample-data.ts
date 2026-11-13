import { addLog, getToday } from '@/db';
import type { DB } from '@/db/types';
import { addDays, fromDateKey, todayKey } from '@/lib/dates';

/**
 * Dev-only (Settings, `__DEV__`): fills the last `days` days (not today) with a known
 * pattern so Stats can be checked by hand. Days that already have logs are skipped.
 * Pattern for "i days ago": i % 9 === 4 → 900 ml, else i % 5 === 0 → 1,800 ml, else 2,600 ml.
 */
export function sampleAmount(daysAgo: number): number {
  if (daysAgo % 9 === 4) return 900;
  if (daysAgo % 5 === 0) return 1800;
  return 2600;
}

export function seedSampleHistory(db: DB, days = 60, now = Date.now()): number {
  const today = todayKey(now);
  let added = 0;
  for (let i = 1; i <= days; i++) {
    const date = addDays(today, -i);
    const noon = fromDateKey(date);
    noon.setHours(12);
    if (getToday(db, noon.getTime()).totalMl > 0) continue;
    addLog(db, { amountMl: sampleAmount(i), ts: noon.getTime() });
    added++;
  }
  return added;
}
