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
- [ ] Move `REMINDER_CHANNEL_ID` into the reminders feature in Phase 5.

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
- [ ] Move `REMINDER_CHANNEL_ID` into `src/features/reminders` (from the Phase 3 audit).
