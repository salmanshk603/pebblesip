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
- [ ] Decide on the canonical primary colour (Stitch `#006A61` vs PRD `#7FD1C7`).
- [ ] Physical phone is only reliable over wireless debugging (USB link drops); use `adb connect <ip:port>`.
