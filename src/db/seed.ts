import { cups, drinks } from './schema';
import type { DB } from './types';

export const WATER_ID = 'water';
export const DEFAULT_CUPS_ML = [150, 250, 500] as const;

/** prd.md §5.3. Water is free; the rest are Premium (P1) and shown locked until Phase 9. */
export const DEFAULT_DRINKS = [
  { id: WATER_ID, name: 'Water', factor: 1.0, icon: 'water', premium: false },
  { id: 'tea', name: 'Tea', factor: 0.9, icon: 'tea', premium: true },
  { id: 'coffee', name: 'Coffee', factor: 0.8, icon: 'coffee', premium: true },
  { id: 'milk', name: 'Milk', factor: 0.9, icon: 'cup', premium: true },
  { id: 'juice', name: 'Juice', factor: 0.9, icon: 'fruit-citrus', premium: true },
  { id: 'soda', name: 'Soda', factor: 0.9, icon: 'bottle-soda', premium: true },
  { id: 'coconut', name: 'Coconut water', factor: 1.0, icon: 'palm-tree', premium: true },
] as const;

/**
 * Idempotent. Built-in drinks are upserted so changes here (names, icons, factors)
 * reach existing installs; custom drinks and the user's cups are never touched.
 */
export function seed(db: DB): void {
  for (const d of DEFAULT_DRINKS) {
    db.insert(drinks)
      .values({ ...d, isCustom: false })
      .onConflictDoUpdate({
        target: drinks.id,
        set: { name: d.name, factor: d.factor, icon: d.icon, premium: d.premium },
      })
      .run();
  }
  const existing = db.select({ id: cups.id }).from(cups).all();
  if (existing.length === 0) {
    db.insert(cups)
      .values(DEFAULT_CUPS_ML.map((ml, i) => ({ id: `cup-${ml}`, amountMl: ml, sortOrder: i })))
      .run();
  }
}
