import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setConsent,
} from '@react-native-firebase/analytics';
import { AdsConsent } from 'react-native-google-mobile-ads';

import { setAnalyticsSink } from './analytics';

/**
 * Connects the analytics facade to Firebase Analytics, after the ad consent flow has run.
 * Collection is off by default (firebase.json) and is switched on only when:
 *  - this is a release build (dev builds keep printing events to the console), and
 *  - the user is outside GDPR regions, or in them and allowed storage + measurement.
 * The advertising ID and ad personalisation signals stay off (firebase.json).
 */
export async function initFirebaseAnalytics(): Promise<void> {
  if (__DEV__) return;
  const analytics = getAnalytics();
  let allowed = true;
  try {
    if (await AdsConsent.getGdprApplies()) {
      const c = await AdsConsent.getUserChoices();
      allowed = c.storeAndAccessInformationOnDevice && c.measureContentPerformance;
    }
  } catch {
    allowed = false; // unknown consent state: don't collect
  }
  await setConsent(analytics, {
    analytics_storage: allowed,
    ad_storage: false,
    ad_user_data: false,
    ad_personalization: false,
  });
  await setAnalyticsCollectionEnabled(analytics, allowed);
  setAnalyticsSink(
    allowed
      ? (event, props) => {
          void logEvent(analytics, event as never, props as never);
        }
      : null,
  );
}
