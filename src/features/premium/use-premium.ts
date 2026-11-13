import { useSyncExternalStore } from 'react';

import { getDb, getSetting } from '@/db';

/** Settings key for the dev-only "pretend Premium" switch (tests premium paths without a purchase). */
export const DEV_PREMIUM_KEY = 'dev_premium';
/** Last known RevenueCat `premium` entitlement, cached so widgets, reminders and offline starts know it. */
export const PREMIUM_CACHE_KEY = 'premium_active';

const listeners = new Set<() => void>();

/** Call after the entitlement (or the dev switch) changes so every `usePremium()` re-renders. */
export function notifyPremiumChanged(): void {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * True when the user has Premium: the cached RevenueCat entitlement, or the dev switch in
 * dev builds. Synchronous, so it also works outside React (reminder sync, widget handler).
 */
export function isPremium(): boolean {
  const db = getDb();
  if (__DEV__ && getSetting(db, DEV_PREMIUM_KEY) === '1') return true;
  return getSetting(db, PREMIUM_CACHE_KEY) === '1';
}

/** Reactive Premium flag. The value comes from the store snapshot (not a bare call) so the
 * React Compiler can't memoize a stale result. */
export function usePremium(): boolean {
  return useSyncExternalStore(subscribe, isPremium);
}
