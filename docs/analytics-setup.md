# Crash reporting & analytics setup

Phase 10 ships `src/lib/analytics.ts`, a small facade. Events are already sent from the app;
in dev builds they're printed (`[analytics] water_logged`), in release they're dropped until
a backend is connected. Nothing else in the app changes when you connect one.

Events (PRD §9): `onboarding_completed`, `water_logged` (`source`: app / widget / notification),
`goal_met`, `widget_added`, `fasting_enabled`, `paywall_shown`, `purchase_completed`,
`reminder_tapped`. Props are small and non-identifying; no health data or personal details.

## Sentry (crashes): DONE (2026-11-14)
`src/lib/sentry.ts`, release builds only, DSN from `SENTRY_DSN` via `app.config.js` `extra`. No PII,
no tracing, no replay, no console breadcrumbs. Test event: build once with `EXPO_PUBLIC_SENTRY_TEST=1`.

### Original steps
1. Create a React Native project in Sentry; copy the DSN.
2. `npx expo install @sentry/react-native`, add its Expo plugin to `app.json`.
3. In `app/_layout.tsx`: `Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN })`, wrap the
   root with `Sentry.wrap`, and call `setCrashSink(Sentry.captureException)`.
4. Add `EXPO_PUBLIC_SENTRY_DSN` to `.env.local`.

## Firebase Analytics: DONE (2026-11-14)
`src/lib/firebase-analytics.ts` connects the facade after the UMP consent flow, release builds only;
`firebase.json` keeps auto-collection, ad ID and ad personalisation off. Verify with
`adb shell setprop debug.firebase.analytics.app com.salmanshaikh.pebblesip` + Firebase DebugView.

### Original steps
1. Create a Firebase project, add the Android app (`com.salmanshaikh.pebblesip`), download
   `google-services.json` to the project root (don't commit it if the repo is public).
2. `npx expo install @react-native-firebase/app @react-native-firebase/analytics`, add the
   plugins and `"android": { "googleServicesFile": "./google-services.json" }` to `app.json`.
3. In `app/_layout.tsx`: `setAnalyticsSink((e, p) => analytics().logEvent(e, p))`.
4. Respect consent: only enable analytics collection when the UMP consent allows it
   (`setAnalyticsCollectionEnabled`).

## Privacy policy / data safety
Declare crash data and app-interaction analytics in the Play data safety form once enabled.
