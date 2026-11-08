import { cups, drinks } from './schema';
import type { DB } from './types';

export const WATER_ID = 'water';
export const DEFAULT_CUPS_ML = [150, 250, 500] as const;

/** Idempotent: inserts defaults only if missing. */
export function seed(db: DB): void {
  db.insert(drinks)
    .values({
      id: WATER_ID,
      name: 'Water',
      factor: 1,
      icon: 'water_drop',
      isCustom: false,
      premium: false,
    })
    .onConflictDoNothing()
    .run();
  const existing = db.select({ id: cups.id }).from(cups).all();
  if (existing.length === 0) {
    db.insert(cups)
      .values(DEFAULT_CUPS_ML.map((ml, i) => ({ id: `cup-${ml}`, amountMl: ml, sortOrder: i })))
      .run();
  }
}
