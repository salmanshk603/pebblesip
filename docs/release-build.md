# Manual release build (no EAS)

## One-time setup (done 2026-11-14)
- Upload keystore: `~/keys/pebblesip-upload.jks`, alias `pebblesip-upload`. **Back it up** (file +
  passwords) outside this repo. Never commit it.
- `~/.gradle/gradle.properties` (outside the repo):
  `PEBBLESIP_UPLOAD_STORE_FILE`, `PEBBLESIP_UPLOAD_KEY_ALIAS`, `PEBBLESIP_UPLOAD_STORE_PASSWORD`,
  `PEBBLESIP_UPLOAD_KEY_PASSWORD`. `plugins/with-release-signing.js` signs release builds with it
  (falls back to the debug key if missing, which Play rejects).
- `.env.local` (AdMob IDs, RevenueCat key, `SENTRY_DSN`) and `google-services.json` in the project
  root are read directly by local builds.

## Every store build
1. Bump `expo.android.versionCode` in `app.json` (must be higher than the last upload). Change
   `expo.version` for user-visible releases (e.g. 1.0.1).
2. Make sure `.env.local` has **no** `EXPO_PUBLIC_UMP_DEBUG_EEA` / `EXPO_PUBLIC_SENTRY_TEST`.
3. Build:
   ```bash
   npx expo prebuild --platform android
   ```
   ```bash
   cd android && ./gradlew bundleRelease && cd ..
   ```
4. Check it's signed with the upload key (not "Android Debug"):
   ```bash
   keytool -printcert -jarfile android/app/build/outputs/bundle/release/app-release.aab | grep Owner
   ```
5. Upload `android/app/build/outputs/bundle/release/app-release.aab` in Play Console →
   Testing → Closed testing → Create release.

## Optional: readable Sentry stack traces
Set `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in your shell before step 3; source maps
are then uploaded automatically. Without a token the upload is skipped (`app.config.js`).

## First upload: Play App Signing
Accept Google's default (Google holds the app signing key; your keystore is the upload key).
If the upload key is ever lost, request an upload-key reset in Play Console.
