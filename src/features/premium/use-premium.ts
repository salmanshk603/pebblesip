import { getDb, getSetting } from '@/db';

/** Settings key for the dev-only "pretend Premium" switch (lets premium paths be tested before Phase 9). */
export const DEV_PREMIUM_KEY = 'dev_premium';

/**
 * Placeholder until RevenueCat (Phase 9). Everyone is on the free tier, except dev builds
 * with the "pretend Premium" switch on. Also usable outside React (reminder sync).
 */
export function isPremium(): boolean {
  return __DEV__ && getSetting(getDb(), DEV_PREMIUM_KEY) === '1';
}

export function usePremium(): boolean {
  return isPremium();
}
