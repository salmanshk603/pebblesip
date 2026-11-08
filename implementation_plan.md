# Pebblesip: Implementation Plan

> Source of truth for *what* to build: `prd.md`. This file covers *how* and *in what order*.
> Rule: work on **one phase at a time**. Prompt: "Execute Phase N from @implementation_plan.md." When a phase is done, tick its boxes and run an audit (`audit.md`) before starting the next one.

**Stack:** Expo (managed, EAS) · TypeScript · Expo Router · expo-sqlite + Drizzle · MMKV · expo-notifications · react-native-android-widget · Reanimated + react-native-svg + Skia (animations in code, see `animations.md`) · RevenueCat · AdMob (+ UMP) · Sentry · Firebase Analytics · adhan. **No backend in v1.**

---

## Phase 0: Prerequisites (no code)
- [ ] Node LTS, Android Studio + emulator, a physical Android phone with USB debugging
- [ ] Expo account + `eas-cli` installed
- [ ] Google Play Console app entry created ("Pebblesip: Water Reminder")
- [ ] Accounts: RevenueCat, AdMob, Sentry, Firebase
- [ ] Domain + privacy policy page hosted (placeholder OK)
- [ ] Start recruiting 18–20 closed testers (see prd.md §10)

## Phase 1: Project setup
- [x] `npx create-expo-app pebblesip` with the TypeScript + Expo Router template
- [x] Folder structure:
  ```
  app/            # routes (Expo Router)
    (onboarding)/
    (tabs)/index.tsx   # Home
    (tabs)/stats.tsx
    (tabs)/widgets.tsx
    (tabs)/settings.tsx
    paywall.tsx
    fasting.tsx
  src/
    db/           # schema, migrations, queries
    features/     # hydration, reminders, fasting, widgets, premium, ads
    components/   # UI kit
    theme/        # colors, typography, spacing (light/dark)
    lib/          # utils (dates, units, goal calc)
  assets/         # icon, splash, Pip lottie files
  ```
- [x] ESLint + Prettier + strict TS
- [x] Theme tokens (Pastel Aqua #7FD1C7, Stone #A8A39A, Cream #F6F1E7, dark mode)
- [x] App icon + splash placeholders, app name, package id (`com.<you>.pebblesip`)
- [x] Development build via EAS (`expo-dev-client`), runs on the phone
- [x] **Widget spike:** render a "Hello" widget with react-native-android-widget in the dev build (de-risk early)

## Phase 2: Local data layer
- [x] Install expo-sqlite + Drizzle; create tables `settings`, `drinks`, `cups`, `logs`, `daily` (prd.md §9)
- [x] Migrations + seed (water drink, 3 default cups: 150/250/500)
- [x] Query helpers: `addLog`, `undoLastLog`, `deleteLog`, `getToday`, `getRange`, `getStreak`
- [x] Day boundary handling (local midnight; timezone changes)
- [x] Unit conversion helpers (ml ↔ oz)
- [x] Unit tests for goal calc, streak calc and rollups (Jest)

## Phase 3: Onboarding
- [ ] 4 steps: welcome/Pip → weight/activity/climate → wake/sleep → units
- [ ] Goal formula (prd.md §5.1) + editable result screen + disclaimer
- [ ] Save to settings; "onboarding complete" flag routes to Home
- [ ] Notification permission request (Android 13+) with explanation screen

## Phase 4: Home / logging
- [ ] Progress ring/fill + today total vs goal + %
- [ ] Skia water wave + level animation (see `animations.md`)
- [ ] Pip as SVG with basic motion (bob, blink, sip bounce); 4 mood states finished in Phase 10
- [ ] Quick-add buttons from `cups`; add-drink bottom sheet (drink + amount)
- [ ] Undo snackbar; today's log list with swipe-to-delete
- [ ] Goal-met celebration (animation + haptic)

## Phase 5: Reminders
- [ ] Schedule local notifications between wake and sleep at the chosen interval
- [ ] Notification action "+250 ml" logs without opening the app
- [ ] Auto-pause when goal met; reschedule on settings change and app start
- [ ] **No exact-alarm permission**
- [ ] Battery-optimisation help screen (Xiaomi/Oppo/Vivo/Samsung guidance)
- [ ] Premium hooks (smart pacing, quiet hours, snooze), gated by a feature flag

## Phase 6: Fasting mode
- [ ] Manual eating window (free); reminders only inside the window; goal spread across the window
- [ ] IF presets 16:8 / 18:6 / 20:4 / OMAD (premium)
- [ ] Ramadan mode: `adhan` prayer times from coarse location or a manual city; method selector (premium)
- [ ] Suhoor pre-dawn reminder sequence (premium)

## Phase 7: Widgets
- [ ] Small widget (progress + "+250 ml" button)
- [ ] Medium widget (progress, Pip, last drink, quick-add)
- [ ] Widget tap logs to SQLite and refreshes; midnight reset refresh
- [ ] Themes: Pastel Aqua (free) + Zen Stone, Glass, Matcha, Night, Ocean, Sakura (premium) + custom accent
- [ ] Widgets gallery screen with previews + "how to add a widget" guide

## Phase 8: Stats & streaks
- [ ] Streak counter + 7-day bar chart (free)
- [ ] 30-day / 12-month charts, averages, best streak, calendar heatmap (premium)
- [ ] CSV export via share sheet (premium)

## Phase 9: Monetization
- [ ] RevenueCat: products monthly / yearly / lifetime; `premium` entitlement
- [ ] Paywall screen (after onboarding, on locked features, in settings); restore purchases
- [ ] `usePremium()` hook gating all premium features
- [ ] AdMob: banner on Stats only (free users); rewarded ad "try a theme for 24h"
- [ ] UMP consent flow (EEA/UK)
- [ ] Test with license testers + test ad units

## Phase 10: Settings, polish & compliance
- [ ] Settings screen (prd.md §5.9) incl. "Delete all data"
- [ ] In-app review prompt (3-day streak / first goal met; max once per 30 days)
- [ ] Sentry + Firebase Analytics events (prd.md §9)
- [ ] Accessibility pass (labels, tap sizes, contrast); RTL check
- [ ] Pip's 4 moods, goal celebration, onboarding reactions, Stats bar animation, reduce-motion fallback (`animations.md`)
- [ ] Final app icon (sea-glass Pip on cream), splash

## Phase 11: Closed testing (14 days)
- [ ] EAS production build (AAB) → upload to the Closed testing track
- [ ] Testers opted in (≥ 12, target 18–20); WhatsApp group for feedback
- [ ] Fix bugs from `bugs.md`; run full `testing.md` each build
- [ ] **Do not pause the track**

## Phase 12: Store listing & launch
- [ ] Data safety form, ads declaration, content rating, target audience 13+
- [ ] Listing: title, short/long description, 8 screenshots, feature graphic, promo video
- [ ] Apply for production access (answer testing questions with collected feedback)
- [ ] Publish 🎉 → start short-video marketing schedule
