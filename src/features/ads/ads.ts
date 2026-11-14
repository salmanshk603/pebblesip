import mobileAds, { AdsConsent, TestIds } from 'react-native-google-mobile-ads';

/**
 * AdMob setup (PRD §5.10). Free users only: one banner on Stats, plus an optional rewarded
 * ad to try a Premium widget theme for 24 h. Never on Home, never an interstitial.
 * Dev builds always use Google's test units; real units come from env in production.
 */
export const AD_UNITS = {
  banner: __DEV__ ? TestIds.ADAPTIVE_BANNER : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? ''),
  rewarded: __DEV__ ? TestIds.REWARDED : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID ?? ''),
};

let canRequest = false;
let started: Promise<boolean> | null = null;
const listeners = new Set<(ok: boolean) => void>();

/**
 * Runs Google's UMP consent flow (shows the form only where required, e.g. EEA/UK), then
 * starts the SDK if ads may be requested. Safe to call many times; runs once.
 */
export function startAds(): Promise<boolean> {
  started ??= (async () => {
    try {
      const info = await AdsConsent.gatherConsent();
      canRequest = info.canRequestAds;
    } catch {
      // Consent gathering failed (e.g. no consent message published in AdMob yet, or offline).
      // Google's guidance: still check canRequestAds; outside the EEA/UK it is usually true.
      canRequest = await AdsConsent.getConsentInfo()
        .then((i) => i.canRequestAds)
        .catch(() => false);
    }
    try {
      if (canRequest) await mobileAds().initialize();
    } catch {
      canRequest = false;
    }
    listeners.forEach((l) => l(canRequest));
    return canRequest;
  })();
  return started;
}

export function adsReady(): boolean {
  return canRequest;
}

export function onAdsReady(fn: (ok: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** True when the user is in a region where a privacy options entry point is required. */
export async function privacyOptionsRequired(): Promise<boolean> {
  try {
    const info = await AdsConsent.getConsentInfo();
    return info.privacyOptionsRequirementStatus === 'REQUIRED';
  } catch {
    return false;
  }
}

export async function showPrivacyOptions(): Promise<void> {
  await AdsConsent.showPrivacyOptionsForm().catch(() => undefined);
}
