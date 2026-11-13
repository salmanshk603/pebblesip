import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { usePremium } from '@/features/premium/use-premium';

import { AD_UNITS, adsReady, onAdsReady } from './ads';

/** The only banner in the app (Stats screen). Renders nothing for Premium or without consent. */
export function StatsBanner() {
  const premium = usePremium();
  const [ready, setReady] = useState(adsReady);
  const [failed, setFailed] = useState(false);
  useEffect(() => onAdsReady(setReady), []);

  if (premium || !ready || failed || !AD_UNITS.banner) return null;
  return (
    <View accessibilityLabel="Advertisement" style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
