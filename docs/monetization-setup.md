# Monetization setup (Phase 9)

The code is in place. These are the account steps only you can do. Until they're done the app
stays free: the paywall shows the PRD prices with "Purchases aren't set up in this build yet",
and dev builds show Google **test** ads.

## 1. Google Play Console
1. Create the app with package `com.salmanshaikh.pebblesip`.
2. Upload a signed release build (AAB) to the **Internal testing** track. Billing only works
   for builds installed from Play.
3. Monetize → Products:
   - Subscription `premium_monthly`: base plan monthly, $1.99 / ₹79.
   - Subscription `premium_yearly`: base plan yearly, $9.99 / ₹399, offer: 3-day free trial.
   - In-app product `premium_lifetime`: $14.99 / ₹699.
   - Use Play's regional pricing for other countries.
4. Setup → License testing: add your Google account(s) as license testers.

## 2. RevenueCat
1. Create a project and an Android app with the package above; connect the Play service
   account (RevenueCat → Google Play credentials).
2. Products: import the three products.
3. Entitlement: `premium`, attached to all three products.
4. Offering `default` (current) with packages: `$rc_monthly`, `$rc_annual`, `$rc_lifetime`.
5. Copy the **Google Play public API key** (starts with `goog_`).

## 3. AdMob
1. Add the Android app in AdMob; create a **Banner** and a **Rewarded** ad unit.
2. Privacy & messaging: create a GDPR (EEA/UK) consent message for the app and publish it.
3. Never tap your own live ads. Dev builds always use Google test units.

## 4. Local config
Copy `.env.example` to `.env.local` (git-ignored) and fill in:
```
EXPO_PUBLIC_RC_ANDROID_KEY=goog_...
ADMOB_ANDROID_APP_ID=ca-app-pub-XXXX~YYYY
EXPO_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-XXXX/BBBB
EXPO_PUBLIC_ADMOB_REWARDED_ID=ca-app-pub-XXXX/RRRR
```
Then rebuild (`npx expo prebuild --platform android` and a new build). The AdMob app ID is a
native setting, so it needs a rebuild, not just a JS reload.

## 5. Then test (testing.md §7 and §8)
- Paywall shows the three plans with Play's localized prices.
- Buy each plan with a license tester; Premium unlocks immediately, the Stats banner disappears.
- Reinstall → Restore purchases → Premium back.
- Cancel the test subscription (test subscriptions renew every few minutes) → Premium relocks.
- Lifetime never expires.
- EEA consent: set a test device hash and `debugGeography: EEA` in `gatherConsent` (see
  `src/features/ads/ads.ts`) to see the form.
