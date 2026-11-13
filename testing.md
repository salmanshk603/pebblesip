# Pebblesip: Test Cases

> Run the relevant sections before finishing any phase, and the **full list** before each closed-test or production build.
> Prompt: "Read @testing.md. Act like a QA tester. Tell me exactly how to manually test each item for the feature I just built, or write automated tests where possible."
> Test on: 1 emulator + at least 1 real phone (ideally also a Xiaomi/Samsung).

---

## 1. Onboarding
- [ ] Fresh install shows onboarding; completing it lands on Home
- [ ] Goal calculates per formula (e.g. 70 kg, moderate, mild → 70×33×1.1 = 2,541 → 2,550 ml)
- [ ] Goal clamps to 1,200–4,500 ml for extreme inputs
- [ ] Goal is editable before finishing
- [ ] ml/oz choice is applied everywhere
- [ ] Denying notification permission still completes onboarding (with a gentle note)
- [ ] Relaunching the app does not show onboarding again

## 2. Logging (Home)
- [ ] Quick-add 250 ml updates total, %, ring and Pip state instantly
- [ ] Undo removes the last entry
- [ ] Swipe-to-delete removes the correct entry and updates totals
- [ ] Non-water drink uses its hydration factor (premium)
- [ ] Reaching 100% triggers the celebration once (not on every later log)
- [ ] Logs over 100% are allowed and shown correctly
- [ ] Data survives app kill and phone restart
- [ ] At local midnight the total resets to 0; yesterday is kept in stats

## 3. Reminders
- [ ] Reminders fire only between wake and sleep time
- [ ] Interval change reschedules correctly
- [ ] "+250 ml" notification action logs without opening the app
- [ ] Reminders stop for the day after the goal is met
- [ ] Reminders resume the next morning
- [ ] Notifications still work after reboot
- [ ] Turning reminders off cancels all scheduled notifications
- [ ] App does not request the exact-alarm permission (check manifest)

## 4. Fasting mode
- [x] Manual window: reminders only inside the window (incl. windows crossing midnight)
- [x] Goal is spread across the window
- [x] IF presets set the correct window (premium)
- [x] Ramadan mode: window = Maghrib → Fajr for the selected city/location (premium)
- [x] Works with location permission denied (manual city)
- [x] Turning fasting mode off restores normal reminders

## 5. Widgets
- [x] Small and medium widgets can be added from the launcher
- [x] Widget "+250 ml" logs and refreshes within ~1s
- [x] Logging in the app updates the widget
- [x] Widget resets after midnight
- [x] Free user: only the free theme applies; premium themes show as locked
- [x] Premium user: all themes + custom accent work
- [x] Widget survives app update and phone restart

## 6. Stats & streaks
- [x] 7-day chart matches logged data
- [x] Streak increments when the goal is met and resets after a missed day
- [x] 30-day / 12-month charts and calendar (premium) are correct
- [x] CSV export opens the share sheet with valid data (premium)

## 7. Premium & purchases
- [ ] Paywall shows monthly / yearly / lifetime with localized prices
- [ ] Purchase (license tester) unlocks premium immediately
- [x] Ads disappear after purchase
- [ ] Restore purchases works after reinstall
- [ ] Cancelled/expired subscription relocks premium features
- [ ] Lifetime purchase never expires

## 8. Ads
- [x] Free users see the banner only on Stats (never on Home, never interstitial after logging)
- [x] Rewarded ad unlocks a theme for 24h, then relocks
- [ ] EEA/UK consent form shows on first launch (test with UMP debug geography)
- [x] Test ad unit IDs used in dev; real IDs only in production builds

## 9. Settings & data
- [ ] All settings persist after restart
- [ ] Light / dark / system theme works
- [ ] "Delete all data" wipes logs and settings and returns to onboarding
- [ ] Privacy policy / support / rate links open correctly

## 10. Quality & compliance
- [ ] Cold start < 2s on a mid-range phone
- [ ] No crashes in a 10-minute monkey test (`adb shell monkey -p <package> 500`)
- [ ] Works fully offline (airplane mode)
- [ ] Screen-reader labels on main buttons; tap targets ≥ 48dp
- [ ] RTL layout (Arabic/Urdu) doesn't break
- [ ] No health/medical claims in the app text
- [ ] Data safety form matches the SDKs actually included
