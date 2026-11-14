# Closed testing (Phase 11)

Google Play requires new personal developer accounts to run a **closed test with at least 12
testers opted in for 14 continuous days** before you can apply for production. Recruit 18–20 so
drop-offs don't reset the clock. **Never pause the track** during the 14 days.

Steps marked **(you)** need your accounts or passwords.

## 1. Accounts (you)
1. Google Play Console developer account (one-time US$25), identity verified.
2. Expo account: `npx eas-cli login`.
3. Link the project to EAS (writes `extra.eas.projectId` into `app.json`; commit it):
   ```bash
   npx eas-cli init
   ```

## 2. Put the secrets into EAS (you)
`.env.local` is git-ignored, so **EAS cloud builds never see it**. Without this step the store
build would have no ads, no purchases and Google's sample AdMob app ID. Create each variable in
the `production` (and `preview`) environment:
```bash
npx eas-cli env:create --environment production --name ADMOB_ANDROID_APP_ID --value "ca-app-pub-…~…" --visibility plaintext
npx eas-cli env:create --environment production --name EXPO_PUBLIC_ADMOB_BANNER_ID --value "ca-app-pub-…/…" --visibility plaintext
npx eas-cli env:create --environment production --name EXPO_PUBLIC_ADMOB_REWARDED_ID --value "ca-app-pub-…/…" --visibility plaintext
npx eas-cli env:create --environment production --name EXPO_PUBLIC_RC_ANDROID_KEY --value "goog_…" --visibility plaintext
```
Firebase config (git-ignored file) goes in as a **file** variable:
```bash
npx eas-cli env:create --environment production --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
```
`app.config.js` points `android.googleServicesFile` at it during cloud builds.

`EXPO_PUBLIC_*` values are bundled into the app (they are public by design), so "plaintext" is
fine. **Never** create `EXPO_PUBLIC_UMP_DEBUG_EEA` in production.

## 3. Create the app in Play Console (you)
- App name **Pebblesip: Water Reminder**, default language English, App, Free (with in-app purchases).
- App content: privacy policy URL
  `https://salmanshk603.github.io/pebblesip/site/privacy.html`; ads = **Yes**; target audience
  **13+**; content rating questionnaire; data safety (see below); no government/financial/health
  claims; app access = all features available without login.
- **Data safety** (current build): data collected = *Device or other IDs* (advertising ID, by AdMob;
  Firebase app-instance ID), *App activity → App interactions* (Firebase Analytics, for analytics); purchase history (Google
  Play/RevenueCat). Data is encrypted in transit; users can request deletion (Settings → Delete all data).
  Location: approximate, **not** collected (used on device only).

## 4. Build and upload
```bash
npx eas-cli build --platform android --profile production
```
EAS creates and keeps the **upload keystore** for you (say yes when asked). Download the `.aab`
from the build page, then in Play Console → Testing → **Closed testing** → create a track
("Closed testers"), add a tester list (Google group or emails), **Create release** → upload the
`.aab` → release notes → **Roll out**. The first release also needs Play App Signing (accept the
default).

Later builds can be sent straight to the track (needs a Play service-account key once):
```bash
npx eas-cli submit --platform android --profile production
```

## 5. Products (for Premium)
Products can only be created after the first `.aab` is uploaded. Then follow
`docs/monetization-setup.md` (subscriptions, lifetime, RevenueCat, license testers). Testers on the
closed track can buy with test cards if they are license testers.

## 6. Recruit testers
Testers must: (1) join the tester list with the Google account they use on the Play Store,
(2) open the **opt-in link** (Closed testing → Testers → "Join on Android"), (3) install from Play,
and (4) keep it installed for 14 days. Opened-only doesn't count; opt-in + install does.

Message to share (WhatsApp group):
> Hi! I'm launching **Pebblesip**, a calm water-reminder app with cute home-screen widgets and a
> Ramadan / fasting mode. Google needs 12+ people to test it for 14 days before it can go public.
> Could you help?
> 1. Send me the Gmail you use on the Play Store.
> 2. Open this link and tap "Become a tester": <opt-in link>
> 3. Install Pebblesip from the Play Store and keep it for 14 days. Log a glass of water now and then 🙂
> Found a bug or have an idea? Reply in this group with a screenshot. Thank you!

## 7. During the 14 days
- Log every reported bug in `bugs.md` (hypothesis + fix plan before code), then fix.
- Each new build: bump nothing by hand (`autoIncrement` handles `versionCode`), run the full
  `testing.md`, upload to the same closed track. Don't pause the track; don't remove testers.
- Keep a short feedback log for Play's production access questionnaire (what testers used, what
  changed because of feedback).

## 8. Before applying for production
- 12+ testers opted in for 14 consecutive days (Play Console shows the count).
- Production access questionnaire answered with real feedback.
