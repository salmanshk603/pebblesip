import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

import { AD_UNITS, adsReady } from './ads';

/** Rewarded ad for "Try a Premium widget theme for 24 h" (PRD §5.10). */

export type RewardResult = 'earned' | 'dismissed' | 'unavailable';

/** Loads and shows one rewarded ad. Resolves 'earned' only if the user watched to the reward. */
export function showRewardedAd(): Promise<RewardResult> {
  if (!adsReady() || !AD_UNITS.rewarded) return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(AD_UNITS.rewarded);
    let earned = false;
    const subs = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => void ad.show()),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => done(earned ? 'earned' : 'dismissed')),
      ad.addAdEventListener(AdEventType.ERROR, () => done('unavailable')),
    ];
    function done(r: RewardResult) {
      subs.forEach((u) => u());
      resolve(r);
    }
    ad.load();
  });
}
