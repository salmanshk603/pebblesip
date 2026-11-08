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
