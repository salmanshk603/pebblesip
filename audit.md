# Pebblesip: Audit Log

> Run after **every completed phase** of `implementation_plan.md`, before starting the next one.
>
> **Prompt to use:**
> "Analyze the current codebase. Compare what is actually built against @implementation_plan.md (Phase N) and @prd.md. What is missing? What was built wrong or differently from the plan? Are there orphaned/unused files, TODOs, hard-coded values, or premium features not gated? Do not write code. Write the findings into @audit.md."

---

## Audit template (copy for each phase)

### Audit: Phase N (<name>), <date>

**Plan items**
| Item | Status (✅ done / ⚠️ partial / ❌ missing) | Notes |
|---|---|---|
| | | |

**Deviations from plan / PRD**
-

**Code health**
- Orphaned / unused files:
- TODOs / hard-coded values:
- Type errors / lint warnings:
- Premium gating correct? (Y/N)
- Out-of-scope features accidentally added? (check prd.md §6)

**Actions before next phase**
- [ ]

---

## Audit history

### Audit: Phase 1 (Project setup), 2026-11-08

**Plan items**
| Item | Status | Notes |
|---|---|---|
| Expo app (TS + Expo Router) | ✅ | Expo SDK 58, React 19.3, RN 0.88. Template demo code removed. |
| Folder structure | ✅ | `app/` routes match the plan (`(tabs)` ×4, `(onboarding)`, `paywall`, `fasting` as placeholders). `src/{db,features/*,components,theme,lib}` created. |
| ESLint + Prettier + strict TS | ✅ | `strict` + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. `tsc` and `expo lint` clean; `expo-doctor` 20/20. |
| Theme tokens (light + dark) | ✅ | `src/theme/` mirrors `design/tokens.json` (pulled from Stitch). Nunito Sans + Inter loaded with `useFonts`. `useTheme()` follows the system scheme. |
| Icon + splash placeholders, name, package id | ✅ | Name "Pebblesip", package `com.salmanshaikh.pebblesip`. Icon = Stitch sea-glass Pip on cream; adaptive foreground/background/monochrome and splash generated from `design/brand/`. Splash cream (light) / `#121414` (dark). |
| Dev build runs on the phone | ✅ | Samsung Galaxy A31, Android 12, installed over wireless debugging; Home loads, tabs switch, dark theme correct. Also verified on emulator (API 37). |
| Widget spike ("Hello") | ✅ | Renders on emulator and phone home screens. Needed BUG-001 fix (`'use no memo'`). |

**Deviations from plan / PRD**
- Dev build was made locally (`expo run:android` / Gradle) rather than via EAS. `eas.json` has a `development` profile, but `eas-cli` isn't installed and no EAS build has been run. That's fine for now; EAS is needed by Phase 11.
- Stitch's light `primary` (`#006A61`) is darker than PRD Pastel Aqua (`#7FD1C7`). Pastel Aqua is kept as `brand.pastelAqua`; screens currently use the Stitch semantic colours. Decide which is canonical before Phase 4.
- Theme follows the system only; the light/dark/system setting (prd.md §5.9) comes with Settings in Phase 10.
- `app.json` blocks `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` up front (confirmed removed in the merged manifest).
- Stitch's Pip mascot has a water droplet above its head that the PRD description doesn't mention; it appears in the placeholder icon/splash. Revisit with the final icon (Phase 10).

**Code health**
- Orphaned / unused files: 7 `.gitkeep` placeholders in empty `src/` folders (expected until their phases). `assets/images/favicon.png` removed (no web target).
- TODOs / hard-coded values: no TODOs. Package id is hard-coded in `app.json`. Widget colours import the light palette only.
- Type errors / lint warnings: none.
- Premium gating correct? N/A (no premium features yet).
- Out-of-scope features accidentally added? No. The only extra deps are `expo-dev-client`, `react-native-android-widget`, `react-native-svg`, Google fonts and lint tooling.

**Actions before next phase**
- [ ] Every widget file must start with `'use no memo';` (BUG-001); keep this in mind for Phase 7.
- [ ] Not a git repository yet. Run `git init` and make a first commit before Phase 2.
- [x] Decide on the canonical primary colour → Stitch `#006A61` (2026-11-08).
- [ ] Physical phone is only reliable over wireless debugging (USB link drops); use `adb connect <ip:port>`.

### Audit: Phase 2 (Local data layer), 2026-11-08

**Plan items**
| Item | Status | Notes |
|---|---|---|
| expo-sqlite + Drizzle, 5 tables | ✅ | `src/db/schema.ts` matches prd.md §9 column for column. Indexes on `logs.date` and `logs.ts`. |
| Migrations + seed | ✅ | `src/db/migrations.ts`: ordered SQL tracked with `PRAGMA user_version`, one transaction each. Seed: `water` (factor 1.0) + cups 150/250/500, idempotent. Verified on emulator after `pm clear`: "1 drink(s), 3 cups, today 0/2000 ml"; relaunch doesn't duplicate. |
| Query helpers | ✅ | `addLog`, `undoLastLog`, `deleteLog`, `getToday`, `getRange`, `getStreak`, plus `setGoalMl`/`getGoalMl`, `get/setSetting`, `recomputeDaily`. Writes are transactional and keep the `daily` rollup in sync. |
| Day boundaries | ✅ | `src/lib/dates.ts`. `logs.date` is the local day at write time, so a later timezone change never moves past entries. Calendar maths is DST-safe; tests run in `America/New_York` and cover spring-forward / fall-back days. |
| ml ↔ oz | ✅ | `src/lib/units.ts` (US fl oz 29.5735 ml), plus kg ↔ lb for onboarding. |
| Jest tests | ✅ | 31 tests in 3 suites: goal formula (incl. the testing.md example 70 kg/moderate/mild → 2,550 ml), units, dates, migrations/seed, logging, undo/delete, goal changes, range fill, streaks. Queries run against real SQLite (better-sqlite3, in memory) using the same migrations. |

**Deviations from plan / PRD**
- Migrations are a small hand-written runner, not `drizzle-kit` generated files. Reason: works unchanged in the app and in Node tests with no Metro/Babel `.sql` loader. Trade-off: `schema.ts` and the SQL must be kept in sync by hand. The migration/seed test exercises both.
- Settings are stored in the `settings` table (prd.md data model) rather than MMKV/AsyncStorage. One store, transactional with logs.
- Streak rule (my interpretation, not spelled out in the PRD): today counts once met; if today isn't met yet, the streak still counts back from yesterday.
- Goal changes apply from today on; past days keep the goal they had (`daily.goal_ml` is a snapshot). This keeps historic "met" days stable.
- `daily.met` is derived from the goal that applied that day. Logs over 100% are allowed; `percent` is capped at 100 for display.
- `app/_layout.tsx` opens the DB on start and prints one `[db] ready` line in dev builds only. Remove or replace it once Home shows real data (Phase 4).

**Code health**
- Orphaned / unused files: none new. `.gitkeep`s removed from `src/db` and `src/lib`.
- TODOs / hard-coded values: `DEFAULT_GOAL_ML = 2000` until onboarding sets a goal. DB name `pebblesip.db`.
- Type errors / lint warnings: none. `tsc`, `expo lint`, `jest` all clean.
- Premium gating correct? N/A. The drink `premium` flag exists; non-water drinks (P1) aren't seeded.
- Out-of-scope features accidentally added? No.

**Not covered yet (needs UI)**
- testing.md §2 "Data survives app kill and phone restart" and the visible midnight reset: check in Phase 4 once Home can log.

**Actions before next phase**
- [ ] Keep `schema.ts` and `MIGRATIONS` in step for every schema change (append a migration, never edit v1).
- [ ] Confirm the streak rule above with the PRD owner.

### Audit: Phase 3 (Onboarding), 2026-11-08

**Plan items**
| Item | Status | Notes |
|---|---|---|
| 4 steps: welcome/Pip → weight/activity/climate → wake/sleep → units | ✅ | `app/(onboarding)/welcome, about, day, units`. Progress dots + Skip on every step (Skip keeps the defaults and moves on). Layout follows `design/light/onboarding.jpg`. |
| Goal formula + editable result + disclaimer | ✅ | `goal.tsx` uses `calcGoalMl`; ±50 ml (or ±1 oz) stepper, "Reset to suggested", "General guidance, not medical advice." |
| Save to settings; complete flag routes to Home | ✅ | `completeOnboarding()` writes weight, units, activity, climate, wake/sleep, volume unit and goal (via `setGoalMl`) plus `onboarding_complete` in one transaction. `(tabs)/_layout` redirects to `/welcome` until it's set. |
| Notification permission with explanation | ✅ | `notifications.tsx` creates the `reminders` channel first (Android 13 only prompts once a channel exists), then asks. |

**testing.md §1 results (emulator, API 37, light mode)**
| Check | Result |
|---|---|
| Fresh install shows onboarding; completing it lands on Home | ✅ |
| Goal per formula (70 kg, moderate, mild → 2,550 ml) | ✅ on screen and in a unit test |
| Goal clamps 1,200–4,500 ml | ✅ unit tests (`calcGoalMl`, `finalGoalMl`); the stepper also stops at the limits |
| Goal editable before finishing | ✅ edited to 2,650 ml; relaunch log showed `today 0/2650 ml` |
| ml/oz choice applied everywhere | ✅ for the screens that exist (goal showed 86 oz). Re-check on Home/Stats/widgets later. |
| Denying notifications still completes (gentle note) | ✅ "No problem. You can turn reminders on any time in Settings." |
| Relaunch doesn't show onboarding again | ✅ after force-stop + relaunch |
| (extra) Allow path | ✅ `POST_NOTIFICATIONS: granted=true`, lands on Home |

**Deviations from plan / PRD**
- Weight uses a −/+ stepper (hold to repeat) instead of the slider in the Stitch design. No slider dependency, and it gives 48dp targets. Range 30–250 kg.
- After onboarding the app goes straight to Home. PRD §7 flow 1 has "paywall (skip)" next; the paywall is Phase 9.
- Wake and bed time can't be equal (Continue is disabled with a message). Other validation, like a very short day, isn't enforced yet.
- New dependencies: `expo-notifications`, `@react-native-community/datetimepicker`, `@expo/vector-icons` (MaterialCommunityIcons).
- Not checked in dark mode yet, and not on the physical phone.

**Code health**
- Orphaned / unused files: none. The Phase 1 placeholder `welcome.tsx` was replaced.
- TODOs / hard-coded values: onboarding copy is inline English (fine for now; localisation is later). `REMINDER_CHANNEL_ID` lives in the onboarding screen; move it to `src/features/reminders` in Phase 5.
- Type errors / lint warnings: none. 36 Jest tests pass (5 new for onboarding save/goal/time helpers).
- Premium gating correct? N/A.
- Out-of-scope features accidentally added? No.

**Actions before next phase**
- [x] Decide the primary colour → **Stitch `#006A61`** (decided 2026-11-08). PRD Pastel Aqua `#7FD1C7` stays as `brand.pastelAqua` for accents.
- [x] Move `REMINDER_CHANNEL_ID` into the reminders feature (done in Phase 5).

### Audit: Phase 4 (Home / logging), 2026-11-08

**Plan items**
| Item | Status | Notes |
|---|---|---|
| Progress fill + total vs goal + % | ✅ | `app/(tabs)/index.tsx`: reservoir, count-up total (~500ms), "% reached" badge (mint when met), remaining / exceeded text, Pip message by progress. Header: greeting, date, streak pill. |
| Skia water wave + level animation | ✅ | `water-reservoir.tsx`: two sine waves, 4s drift, level eases over 600ms. Drift pauses when Home loses focus. |
| Pip basic motion | ✅ | `animated-pip.tsx`: bob ±4px/2.5s, blink every 4s, squash & stretch on each sip. Moods are Phase 10. |
| Quick-add + add-drink sheet | ✅ | Quick-add from `cups` with press-scale + light haptic. Sheet: drinks (premium ones locked with a hint), ±50 ml stepper (50–2,000), % of goal, cup presets. |
| Undo snackbar + swipe-to-delete | ✅ | Snackbar slides up 200ms, hides after 4s. `ReanimatedSwipeable` rows (also a screen-reader "Delete" action); rows enter from the top and collapse on delete. |
| Goal-met celebration | ✅ | Droplet burst (~1.2s) + success haptic, once per day via `claimGoalCelebration` (unit-tested; undo + re-cross doesn't repeat). |

**testing.md §2 results (emulator, API 37)**
| Check | Result |
|---|---|
| Quick-add updates total, %, fill and Pip instantly | ✅ (oz and ml) |
| Undo removes the last entry | ✅ |
| Swipe-to-delete removes the right entry and updates totals | ✅ 23.7 → 13.5 oz |
| Non-water drink uses its factor (premium) | ⏸ locked until Phase 9; factor maths unit-tested (coffee 250 → 200 ml) |
| Celebration once, not on every later log | ✅ on device + unit test |
| Logs over 100% allowed and shown | ✅ "Goal exceeded by +450 ml" |
| Data survives app kill and phone restart | ✅ force-stop and full emulator reboot |
| Local midnight resets to 0; yesterday kept | ✅ clock set to 23:59 with the app open; rolled to the new day; the 8 Nov data was still there afterwards |
| (extra) Reduce motion | ✅ with system animations off, wave/Pip/burst are static |

**Bugs**
- BUG-002 (water level drawn one step behind) found and fixed during testing. See `bugs.md`.

**Deviations from plan / PRD**
- PRD drinks (tea 0.9, coffee 0.8, milk 0.9, juice 0.9, soda 0.9, coconut 1.0) are now seeded as Premium and shown locked. `usePremium()` is a stub returning `false` until Phase 9.
- The seed now upserts built-in drinks so name/icon/factor changes reach existing installs (found when an old `water_drop` icon showed as "?").
- The midnight refresh polls the local date every 30s instead of one long timer, so manual clock and timezone changes are picked up too.
- The amount slider in the add-drink design is a −/+ stepper (same as onboarding). In oz mode the step is 50 ml (~1.7 oz), which looks uneven; revisit in Phase 10 polish.
- No bell icon in the header (no notification centre in the PRD).
- Not yet checked in dark mode or on the physical phone.

**Code health**
- Orphaned / unused files: none. `.gitkeep` removed from `features/hydration` and `features/premium`.
- TODOs / hard-coded values: Home copy is inline English. Quick-add labels are keyed by amount (150/250/500).
- Type errors / lint warnings: none. 39 Jest tests pass.
- Premium gating correct? Yes for drinks: locked in the sheet, not loggable.
- Out-of-scope features accidentally added? No.
- The dev-only `[db] ready` log was removed from `app/_layout.tsx`.

**Test-data note**
- The emulator DB now has logs on 9–13 Nov from the clock tests. Wipe the app data before judging Stats in Phase 8.

**Actions before next phase**
- [ ] Check Home in dark mode and on the Galaxy A31.
- [x] Move `REMINDER_CHANNEL_ID` into `src/features/reminders` (done in Phase 5).

### Audit: Phase 5 (Reminders), 2026-11-13

**Plan items**
| Item | Status | Notes |
|---|---|---|
| Notifications between wake and sleep at the chosen interval | ✅ | `src/features/reminders/plan.ts` (pure, tested) + `reminders.ts`. One-off date triggers for today and the next 2 days; first at wake time, none at or after bedtime; windows past midnight supported. Intervals 30/60/90/120 min, default 60. |
| "+250 ml" action logs without opening the app | ✅ | Category button with `opensAppToForeground: false`. Foreground: response listener in `app/_layout.tsx`. Background/killed: `TaskManager` task registered in `index.ts`. Presses are de-duplicated (last 30 ids) so a press is never logged twice. |
| Auto-pause when goal met; reschedule on settings change and app start | ✅ | `syncReminders()` runs on app start, after onboarding, after every add/undo/delete, after an action press, and on settings changes. Overlapping calls coalesce. |
| No exact-alarm permission | ✅ | Both permissions blocked in `app.json`; not in the installed package. expo-notifications falls back to inexact `setAndAllowWhileIdle`. |
| Battery-optimisation help | ✅ | `app/battery-help.tsx`: this phone's brand first (via `expo-device`), Xiaomi/Samsung/Oppo/Vivo/other steps, button opens the system battery-optimisation list (no extra permission). |
| Premium hooks behind a flag | ✅ | `FEATURE_FLAGS.premiumReminders` (off) + `usePremium()`. Planner supports quiet hours and smart pacing (gap shrinks to at most half when behind; tested); snooze 15 min action. |

**testing.md §3 results (emulator, API 37)**
| Check | Result |
|---|---|
| Fire only between wake and sleep | ✅ AlarmManager dump: hourly 07:00–22:00, nothing at 23:00, 44 alarms over 3 days |
| Interval change reschedules | ✅ 1 h → 2 h: 44 → 22, odd hours only |
| "+250 ml" logs without opening the app | ✅ app in background (shade stayed open, notification dismissed, +250 ml) and app process killed (headless task ran; opening the app showed one log, no duplicate) |
| Stop for the day after goal met | ✅ after 2,650 / 2,550 ml: no alarms left today |
| Resume next morning | ✅ next alarm 14 Nov 07:00 |
| Still work after reboot | ✅ emulator cold boot, app not opened: all 16 alarms back (expo-notifications boot receiver) |
| Turning off cancels everything | ✅ 16 → 0, back to 16 when on |
| No exact-alarm permission in manifest | ✅ |

Not tested on the physical phone yet (Samsung battery behaviour is the real-world risk).

**Deviations / decisions**
- Rolling 3-day schedule instead of repeating triggers, so "pause for today" works. Downside: if the app isn't opened (and nothing is logged) for 3 days, reminders stop until it is. Phase 7 widget logging also reschedules, which helps.
- Inexact alarms can arrive a few minutes late, especially in Doze. That's expected without the exact-alarm permission.
- Reminders switch defaults to on; the toggle asks for notification permission if it's missing. Denied permission shows a link to system settings.
- `src/lib/data-events.ts`: tiny listener so Home refreshes when a notification action logs while the app is open.
- Settings tab now contains only the Reminders section plus a dev-only "send test reminder in 5 s" button (`__DEV__` only). The full Settings screen is Phase 10.
- iOS bundle id added earlier for simulator dev builds; iOS stays out of v1 scope.

**Code health**
- Orphaned / unused files: none. `.gitkeep` removed from `features/reminders`.
- TODOs / hard-coded values: reminder messages are inline English; "+250 ml" amount is fixed per the PRD.
- Type errors / lint warnings: none. 50 Jest tests pass (9 planner, 2 battery guide new).
- Premium gating correct? Yes: extras need the flag and Premium; both are off.
- Out-of-scope features accidentally added? No.

**Actions before next phase**
- [ ] Check reminders and the background action on the Galaxy A31 (wireless debugging).
- [ ] Fasting mode (Phase 6) must plug into `planReminders` as a different window.

---

### Audit: Phase 6 (Fasting mode), 2026-11-13

| Item | Status | Notes |
|---|---|---|
| Manual eating window (free); reminders only inside the window | ✅ | `src/features/fasting/window.ts` (pure, tested) gives the window; `syncReminders()` passes it to `planReminders` in place of wake/sleep. Windows crossing midnight work (18:30 → 04:30). |
| Goal spread across the window | ✅ | `perReminderMl()` splits the goal over the window's reminder slots (rounded to 10 ml). Shown on the fasting screen ("about 510 ml every 2 h") and added to each reminder's text ("About 510 ml now."). |
| IF presets 16:8 / 18:6 / 20:4 / OMAD (premium) | ✅ | Eating window = start time + 8 / 6 / 4 / 1 h. OMAD is a 1-hour window. |
| Ramadan mode (premium) | ✅ | `adhan` computes Maghrib (today) → Fajr (tomorrow) on the phone. 12 calculation methods. 16-city manual list, or "Use my approximate location" (coarse only, rounded to 2 decimals, never leaves the phone). |
| Suhoor pre-dawn sequence (premium) | ✅ | Two reminders, 30 and 15 min before each Fajr, for the same 3-day horizon. Only in Ramadan mode with the switch on. |

**testing.md §4 results (emulator, API 37, device time zone IST)**
| Check | Result |
|---|---|
| Manual window, incl. crossing midnight | ✅ 18:30–04:30 at 2 h: alarms 18:30, 20:30, 22:30, 00:30, 02:30 only (today skipped because the goal was already met) |
| Goal spread across the window | ✅ 2,550 ml over 18:30–04:30 at 2 h, shown as "about 510 ml every 2 h" |
| IF presets set the correct window | ✅ 16:8 from 18:30 → 18:30–02:30; all presets covered by unit tests |
| Ramadan window = Maghrib → Fajr | ✅ Mumbai, Muslim World League, 13 Nov: 18:01 → 05:29. 21 alarms = 15 in the window + 6 Suhoor (04:59/05:14, 05:00/05:15 …) |
| Works with location denied | ✅ Permission dialog offers approximate only; "Don't allow" shows "Location is off. Pick your city…" and opens the city list |
| Turning fasting off restores normal reminders | ✅ back to 07:00–21:00 every 2 h (16 alarms) |
| Locked for free users | ✅ IF/Ramadan show a lock; tapping opens the paywall placeholder. Saved premium modes fall back to the manual window without Premium (unit test). |

**Deviations / decisions**
- Ramadan window is computed once per sync from today's prayer times and reused for the 3-day horizon (a 1–2 min daily drift). It's recomputed on every app open and log.
- Prayer times are shown in the device's time zone. A manual city in another time zone gives that city's times converted to local time.
- IF presets use the "Eating starts" time as the anchor; the end is calculated.
- Added `expo-location` (coarse only). `ACCESS_FINE_LOCATION` and `ACCESS_BACKGROUND_LOCATION` are blocked in `app.json`.
- `usePremium()` now has `isPremium()` for non-React code (reminder sync) and a **dev-only** "Pretend Premium" switch in Settings (`__DEV__` only), so premium paths can be tested before RevenueCat (Phase 9).
- `intervalLabel` moved from `app/(tabs)/settings.tsx` to `src/features/reminders/plan.ts` (shared with the fasting screen).
- Entry point: Settings → "Fasting mode". The full Settings screen is Phase 10.

**Code health**
- Orphaned / unused files: `features/fasting/.gitkeep` removed.
- TODOs / hard-coded values: the city list is a short built-in list; method names and messages are inline English.
- Type errors / lint warnings: none. 59 Jest tests pass (9 new fasting tests).
- Premium gating correct? Yes: IF/Ramadan/Suhoor need `isPremium()`, which is false in release builds.
- Out-of-scope features accidentally added? No.

**Actions before next phase**
- [ ] Check fasting reminders on the Galaxy A31.
- [ ] Emulator adb server crashes during a streamed `adb install` of the 137 MB debug APK; use `adb push` + `pm install` as a workaround.

---

### Audit: Phase 7 (Widgets), 2026-11-13

| Item | Status | Notes |
|---|---|---|
| Small widget (progress + "+250 ml") | ✅ | `PebbleSmall` 2×2: Pip, %, amount, progress bar, one-tap "+". `src/features/widgets/water-widgets.tsx`. |
| Medium widget (progress, Pip, last drink, quick-add) | ✅ | `PebbleMedium` 4×2: Pip, amount / goal, progress, "Last drink HH:MM", the user's first three cups as buttons. |
| Widget tap logs and refreshes; midnight reset | ✅ | `WIDGET_CLICK` → `addLog` → redraw this and the other widget → `syncReminders`. Midnight: native receiver from `plugins/with-widget-midnight.js` (BUG-003). |
| Themes: Pastel Aqua (free) + 6 premium + custom accent | ✅ | `src/features/widgets/themes.ts`; `resolveTheme` falls back to Pastel Aqua / no accent without Premium (unit tested). |
| Widgets gallery + "how to add" guide | ✅ | Widgets tab: live `WidgetPreview` of every theme, "Add small" / "Add wide" (`requestPinWidget`), "Show me how" steps, accent swatches. |

**testing.md §5 results (emulator, API 37)**
| Check | Result |
|---|---|
| Add from launcher | ✅ both via the pin dialog |
| Widget "+250 ml" logs and refreshes within ~1s | ✅ both widgets updated in under 1 s; also with the app process killed |
| Logging in the app updates the widget | ✅ |
| Widget resets after midnight | ✅ after the BUG-003 fix: app closed, 23:59:30 → 0% at 00:06 |
| Free user: only free theme; premium locked | ✅ locks on 6 themes and all accents; tapping opens the paywall; placed widgets fall back to Pastel Aqua |
| Premium user: themes + custom accent | ✅ Night, then Night + blue accent on both widgets (dev "Pretend Premium") |
| Survives app update and phone restart | ✅ reinstall kept both widgets; release build after a cold boot: widgets drawn, "+" logged, midnight alarm re-armed |

**Deviations / decisions**
- Midnight reset needed native code (BUG-003): one inexact `setWindow` alarm, 10-min window, no exact-alarm permission. Android's `updatePeriodMillis` (30 min) stays as a backstop.
- Dev builds draw blank widgets after a reboot until Metro is reachable. Release builds are fine. Test widget restarts on a release build.
- Widget picker preview images (`assets/images/widget-*-preview.png`) are still the app icon. Replace with real widget screenshots before store listing.
- Glass is translucent; the gallery shows it over a tinted card.
- `refreshWidgets()` runs after every log/undo/delete, on app start, on the in-app date rollover, after a reminder action (via `setOnReminderLogged`, avoids an import cycle), and when Premium changes. Phase 9 (purchases) must also call it.
- Phase 1 "Hello" spike widget removed.

**Code health**
- Orphaned / unused files: `hello-widget.tsx` removed.
- TODOs / hard-coded values: placeholder preview images; theme colours are inline in `themes.ts`.
- Type errors / lint warnings: none. 61 Jest tests pass (2 new theme-gating tests).
- Premium gating correct? Yes: `resolveTheme` + `isPremium()`.
- Out-of-scope features accidentally added? No. ("Rewarded ad to try a theme for 24h" is Phase 9.)

**Actions before next phase**
- [ ] Real widget preview images.
- [ ] Check widgets on the Galaxy A31 (Samsung One UI launcher, battery saver).
- [ ] Phase 9: call `refreshWidgets()` after purchase/restore/expiry.
