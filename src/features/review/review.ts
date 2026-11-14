import * as StoreReview from 'expo-store-review';

import { getSetting, setSetting } from '@/db/queries';
import type { DB } from '@/db/types';

import { REVIEW_KEY, shouldAskForReview } from './review-rules';

/**
 * Asks Google Play to show its review card (Play decides whether it actually appears).
 * Never gates anything on the result.
 */
export async function maybeAskForReview(
  db: DB,
  streak: number,
  goalMetToday: boolean,
  now = Date.now(),
): Promise<void> {
  const raw = Number(getSetting(db, REVIEW_KEY));
  const last = Number.isFinite(raw) && raw > 0 ? raw : null;
  if (!shouldAskForReview(last, streak, goalMetToday, now)) return;
  try {
    if (!(await StoreReview.hasAction())) return;
    setSetting(db, REVIEW_KEY, String(now));
    await StoreReview.requestReview();
  } catch {
    // Not installed from Play, or the API is unavailable: try again another day.
  }
}
