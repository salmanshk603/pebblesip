# Pebblesip: Bug Log

> Document a bug **before** asking for a fix.
> Prompt: "Read this bug in @bugs.md. Do not write any code yet. Tell me your hypothesis for why it happens and your plan to fix it." Only after the plan makes sense: "Apply the fix." Then move the bug to **Fixed**.

---

## Bug template

### BUG-000: <short title>
- **Status:** Open / Investigating / Fixed
- **Severity:** Critical (crash/data loss) · High · Medium · Low
- **Device / Android version:** e.g. Redmi Note 12, Android 14
- **Build:** e.g. 1.0.0 (5), dev / closed test
- **Steps to reproduce:**
  1.
  2.
- **Expected:**
- **What happens:**
- **Error / logs:** (console, Sentry link, `adb logcat` snippet)
- **Files involved:**
- **Hypothesis:**
- **Fix:** (what changed, commit)

---

## Open

_None._

## Fixed

### BUG-003: Widgets keep yesterday's total after midnight when the app is closed
- **Status:** Fixed (2026-11-13)
- **Severity:** Medium (wrong numbers on the home screen for up to ~50 min; logging still goes to the right day)
- **Device / Android version:** Emulator Medium_Phone_API_37.0
- **Build:** 0.1.0 dev client, Phase 7 work in progress
- **Steps to reproduce:**
  1. Place the small and wide widgets. Log some water.
  2. Close the app (Home). Let the clock pass midnight (tested with `cmd alarm set-time` 23:59:30).
- **Expected:** both widgets reset to 0% shortly after midnight.
- **What happens:** at 00:00:23 both still show 3,050 ml / 100% and "Last drink 11:21".
- **Error / logs:** `dumpsys alarm`: the only widget refresh is the system `APPWIDGET_UPDATE` repeat (`repeatInterval=1800000`, `window=+22m30s`), elapsed-time based, next in ~27 min.
- **Files involved:** `app.json` (widget `updatePeriodMillis`), `src/features/widgets/widget-task-handler.tsx`
- **Hypothesis:** nothing tells the widgets the day changed. The app's 30 s date poll only runs while the app is open, and Android's periodic widget update is at most every 30 min, inexact and not tied to the clock. Midnight sends no broadcast an app can receive while closed (`ACTION_DATE_CHANGED` is not exempt from implicit-broadcast limits).
- **Fix:** `plugins/with-widget-midnight.js` generates `WidgetMidnightReceiver.kt` and registers it. One inexact `setWindow(RTC_WAKEUP, 00:01, 10 min)` alarm per night (no exact-alarm permission; `setAndAllowWhileIdle` was tried first but Android gave it a 1-hour window). It sends `APPWIDGET_UPDATE` to both providers and re-arms. It is re-armed on boot, time/timezone change, app update and every app process start (`MainApplication.onCreate`), and cancelled when no widgets are placed. Verified on the emulator with the app closed: 23:59:30 → widgets at 0% at 00:06; alarm re-armed for the next night; re-armed after a cold boot. Note: in the **dev** build, widgets are blank after a reboot until Metro is reachable (`Unable to load script`); the release build renders them straight away.
- **Fix plan (as approved):** add a small native piece through an Expo config plugin (`plugins/with-widget-midnight.js`): a `BroadcastReceiver` that sets one **inexact** `setAndAllowWhileIdle(RTC_WAKEUP, nextMidnight + 1 min)` alarm (no exact-alarm permission). When it fires it sends `APPWIDGET_UPDATE` to both widget providers (the JS task handler then redraws from SQLite) and schedules the next midnight. It is (re)scheduled on `BOOT_COMPLETED`, `TIME_SET`, `TIMEZONE_CHANGED`, app update (`MY_PACKAGE_REPLACED`) and whenever a widget is added. Keep `updatePeriodMillis` (30 min) as a backstop. Re-test: clock to 23:59:30 with the app closed; widgets show 0% within ~2 min; still works after a reboot.


### BUG-002: Home water level is drawn one step behind
- **Status:** Fixed (2026-11-08)
- **Severity:** Medium (wrong visual; numbers are right)
- **Device / Android version:** Emulator Medium_Phone_API_37.0
- **Build:** 0.1.0 dev client, Phase 4 work in progress
- **Steps to reproduce:**
  1. Goal 2,550 ml, 0 logged. Tap +500 ml twice (1,000 ml, 39%).
  2. Tap Undo (500 ml, 20%). Or let the day roll over at midnight.
- **Expected:** the reservoir water animates to 39%, then down to 20% (or to 0% at midnight).
- **What happens:** at 1,000 ml it shows the 500 ml level; after undo it shows the 1,000 ml level. After midnight it stays at yesterday's level.
- **Error / logs:** a debug log shows the `level` shared value does reach the new target (`+1s level 0`), so the animation runs but the Skia path isn't redrawn from it.
- **Files involved:** `src/features/hydration/water-reservoir.tsx`
- **Hypothesis:** the `useDerivedValue` worklets call a helper (`makeWave`) that reads `level.value` / `phase.value`. Reanimated finds a derived value's inputs from shared values referenced directly in its worklet, so neither is tracked. The path only recomputes when React re-renders (new worklet), using whatever `level` was at that moment, which is the previous value.
- **Fix:** `useDerivedValue` now reads `level.value` and `phase.value` directly and passes them to a pure `makeWave(lvl, ph, …)`. Verified on the emulator: 500 → 1,000 → 1,500 ml then undo shows 20% / 39% / 59% / 39%, and the midnight rollover empties the reservoir. Rule: never read shared values only inside a helper called from a derived worklet.
- **Fix plan (as followed):** read `level.value` and `phase.value` directly inside each `useDerivedValue` and pass them into a pure path builder. Remove the debug logs. Re-test: +500 twice, undo, and the midnight rollover; the level should match the % each time.

### BUG-001: Hello widget is never drawn on the home screen
- **Status:** Fixed (2026-11-08)
- **Severity:** High (blocks the Phase 1 widget spike)
- **Device / Android version:** Emulator Medium_Phone_API_37.0 (Pixel launcher)
- **Build:** 0.1.0, dev client (`expo run:android`)
- **Steps to reproduce:**
  1. Long-press home screen → Widgets → search "Pebblesip"
  2. Tap the 3×2 "Phase 1 spike widget" → Add
- **Expected:** a cream "Hello / from Pebblesip" widget appears on the home screen.
- **What happens:** the picker closes and nothing is placed.
- **Error / logs:** `ReactNativeJS: Widget Error: Invalid Hook Call detected in HelloWidget ... The React Compiler (React 19) is transforming this component, but this library requires raw functions. Fix: Add "use no memo"`
- **Files involved:** `src/features/widgets/hello-widget.tsx`, `app.json` (`experiments.reactCompiler: true`)
- **Hypothesis:** `app.json` turns on the React Compiler for every file. It rewrites `HelloWidget` to use its memo cache hook. react-native-android-widget calls widget components as plain functions outside React rendering, so any hook throws and the widget never renders.
- **Fix:** added `'use no memo';` to `src/features/widgets/hello-widget.tsx`. Verified on the emulator: the widget renders "Hello / from Pebblesip" and logcat shows no widget errors. Every future widget file must start with this directive.
- **Fix plan (as approved):** add the `'use no memo';` directive at the top of every widget component file (now `hello-widget.tsx`, later all Phase 7 widgets) so the compiler skips them, and keep the compiler on for the app. Rebuild JS, re-add the widget, confirm it renders and logcat is clean.


---

## Known risk areas to watch
- Notifications not firing on aggressive battery-saver brands (Xiaomi, Oppo, Vivo, Samsung)
- Widget not refreshing after logging from the app/notification
- Day rollover at midnight / timezone or DST change
- Fasting window crossing midnight (e.g. 18:30 → 04:30)
- Purchases not restored after reinstall
- Ads shown to Premium users
