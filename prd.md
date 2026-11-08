# Pebblesip: Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Pebblesip: Water Reminder |
| **Platform** | Android first (Google Play), iOS later |
| **Owner** | Salman Shaikh (solo developer) |
| **Version** | v1.0 (MVP) |
| **Status** | Draft |
| **Last updated** | 8 Nov 2026 |

---

## 1. Overview

Pebblesip is a calm, cute water reminder and tracker for Android. Its main draws are **aesthetic home-screen widgets**, **smart reminders that don't nag**, and a **fasting mode** (Ramadan and intermittent fasting). A small original pebble mascot called **Pip** reacts to your progress.

**Tagline:** *Little sips, every day.*

**Positioning:** We are not trying to beat Waterllama. We want a profitable slice of the large "water reminder" search category by being:
1. **Beautiful on the home screen** (widgets people want to show off).
2. **Respectful** (reminders only in waking hours; no 3am nagging; light ads).
3. **Different for fasting users**, an audience most water apps ignore.

---

## 2. Goals & non-goals

### Goals (v1)
- Ship to Play Store production within ~25 days (including the 14-day closed test).
- Earn revenue from launch day (banner ads + Premium).
- Retention: users log water on most days (driven by widget + reminders + streaks).
- Get a 4.5★+ rating via a polished, bug-free experience.

### Non-goals (v1)
- Competing on number of features or characters with Waterllama / Plant Nanny.
- Social features, accounts, cloud sync.
- Medical or health advice.

---

## 3. Target users

| Persona | Description | What they want |
|---|---|---|
| **Aesthetic Aisha** (18–30) | Customises her home screen, follows widget/aesthetic trends on TikTok/Pinterest | Pretty widgets that match her wallpaper; cute, calm vibe |
| **Busy Rahul** (22–40) | Office or remote worker who forgets to drink | Reminders that work but don't annoy; one-tap logging |
| **Fasting Fatima** (18–50) | Observes Ramadan or does intermittent fasting (16:8 etc.) | Hydration planned only inside the eating window; pre-dawn drink plan |

---

## 4. Success metrics (first 60 days after launch)

| Metric | Target (initial guess, to refine) |
|---|---|
| Day-1 retention | ≥ 35% |
| Day-7 retention | ≥ 15% |
| % of active users with a widget added | ≥ 25% |
| Free → Premium conversion | ≥ 2% |
| Crash-free users | ≥ 99.5% |
| Play Store rating | ≥ 4.5★ |

---

## 5. Feature list

Priority: **P0** = must ship in v1 · **P1** = ship in v1 if time allows · **P2** = later.
Tier: **Free** / **Premium**.

### 5.1 Onboarding: P0, Free
- 4 short steps, skippable:
  1. Welcome + meet Pip.
  2. Weight (kg/lb), activity level (low / moderate / high), climate (cool / mild / hot).
  3. Wake-up and sleep time (reminder window).
  4. Units (ml / oz), then a notification permission request with an explanation.
- Calculates a **daily goal** (editable). Formula (simple, non-medical):
  `goal_ml = weight_kg × 33 × activity_factor × climate_factor`, rounded to the nearest 50 ml, clamped 1,200–4,500 ml.
  - activity_factor: low 1.0 · moderate 1.1 · high 1.25
  - climate_factor: cool 0.95 · mild 1.0 · hot 1.15
- Show the disclaimer: "General guidance, not medical advice."

### 5.2 Home / Today screen: P0, Free
- Big progress ring or fill visual with **Pip** reacting (sleepy → happy → glowing at 100%).
- Today's total vs goal (e.g. 1,250 / 2,300 ml) and %.
- **One-tap quick-add buttons** (default 150 / 250 / 500 ml; editable).
- **Undo** the last entry (snackbar).
- Today's log list (time, amount, drink), with swipe to delete.
- Celebration animation + haptic when the goal is reached.

### 5.3 Drinks: P0 (water) / P1 (others)
- Water (Free).
- Other drinks with hydration factor: tea 0.9, coffee 0.8, milk 0.9, juice 0.9, soda 0.9, coconut water 1.0 (**Premium**, P1).
- Custom cup sizes (Free: 3 presets; Premium: unlimited).

### 5.4 Smart reminders: P0, Free (basic) / Premium (advanced)
- **Free:**
  - Reminders every X minutes (30/60/90/120), only between wake and sleep time.
  - Pause automatically for the day once the goal is reached.
  - Notification action button: **"+250 ml"** (logs without opening the app).
- **Premium:**
  - **Smart pacing**: interval adapts to how far behind schedule you are.
  - **Quiet hours** (meetings / gym) and a **snooze** action.
  - Custom reminder sounds and messages from Pip.
- **Technical rule:** use standard scheduled notifications (`expo-notifications`). **Do NOT request `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`** (Play restricts these to alarm/calendar apps).

### 5.5 Fasting mode: P0 (basic), Free + Premium
- **Free:**
  - Toggle fasting mode with a fixed eating window (e.g. 18:30–04:30), set manually.
  - Reminders fire **only inside the eating window**.
  - Daily goal is redistributed across the window.
- **Premium:**
  - **Ramadan mode:** auto eating window from **prayer times** based on location (Maghrib → Fajr), calculated on the phone with an offline calculation library (e.g. `adhan`); calculation method selectable.
  - **Intermittent fasting presets** (16:8, 18:6, 20:4, OMAD).
  - **Suhoor drink plan:** pre-dawn reminder sequence ("2 glasses before Fajr").
- Location permission is **optional** (coarse location only, or a manual city). It's never required for core use.

### 5.6 Home-screen widgets: P0, the key differentiator
- Built with `react-native-android-widget`.
- **Widget types:**
  1. **Small (2×1 / 2×2):** progress + **one-tap "+250 ml"** button.
  2. **Medium (4×2):** progress, Pip, last drink time, quick-add buttons.
- **Free:** 1 style (Pastel Aqua).
- **Premium themes:** Zen Stone, Glass (translucent), Matcha, Night (AMOLED black), Ocean, Sakura. Also **custom accent colour** to match the user's wallpaper.
- Widget updates immediately after logging (from app or widget) and at midnight reset.

### 5.7 Stats & streaks: P0 (basic) / Premium (full)
- **Free:** streak counter (days goal met), 7-day bar chart.
- **Premium:** 30-day / 12-month charts, average intake, best streak, calendar view (heatmap), CSV export.

### 5.8 Pip the mascot: P0 (basic) / P2 (more)
- One original character (a smooth round pebble with a water-shine highlight) with 4 states: sleepy, okay, happy, glowing.
- **Colour (final):** sea-glass aqua-mint gradient `#8FD9CC` → `#5FC2B4`, white glossy highlight, dark dot eyes, small smile, soft pink blush.
- **App icon:** Pip centered on a cream gradient `#F6F1E7` → `#EDE3D1`; monochrome outline version for themed icons.
- Animated in code (SVG + Reanimated); see `animations.md`.
- P2: unlockable outfits/accessories as rewards for streaks (retention), and seasonal skins.
- **Must be 100% original.** No resemblance to Waterllama, Plant Nanny or other apps' characters.

### 5.9 Settings: P0
- Goal (auto or manual), units, wake/sleep time, reminder interval, cup presets.
- Fasting mode settings.
- Theme: light / dark / system (app); widget theme.
- Notifications: on/off, sound.
- Data: reset today, **delete all data**, export (Premium).
- Premium: manage / restore purchases.
- Links: privacy policy, terms, contact support (email), rate app.

### 5.10 Monetization: P0
- **Ads (Free users only)** via Google AdMob:
  - **One small banner** on the Stats screen only. **No banner on Home**; **never** an interstitial after logging water.
  - **Optional rewarded ad**: "Try a Premium widget theme for 24h."
  - UMP consent form (Google's tool) for EEA/UK users.
- **Premium (removes ads + unlocks features)** via Google Play Billing using **RevenueCat**:

| Plan | USD | India (INR) |
|---|---|---|
| Monthly | $1.99 | ₹79 |
| Yearly | $9.99 | ₹399 |
| Lifetime (one-time) | $14.99 | ₹699 |

  - Use Play's regional pricing for other countries.
  - Paywall shown: after onboarding (dismissible), when tapping a locked feature, and in Settings.
  - **Restore purchases** must work after reinstall.
  - Optional launch offer: 3-day free trial on yearly.

### 5.11 Review prompt: P1
- Google Play In-App Review API after a **3-day streak** or the first goal completion. Shown at most once per 30 days.
- Never gate features on leaving a review (Play policy).

### 5.12 Health Connect sync: P2
- Write hydration records to Health Connect (requires the Health Connect permission declaration). Not in v1.

---

## 6. Out of scope for v1
- User accounts, login, cloud sync / backup (Supabase can come in v1.1 for Premium backup).
- Social features (friends, duels, sharing streaks).
- Wear OS / smartwatch app.
- Health Connect / Google Fit.
- AI features.
- iOS build (Expo makes this possible later).
- 100+ characters/collectibles.

---

## 7. User flows

1. **First launch:** Welcome → profile (weight, activity, climate) → wake/sleep → units → goal shown → notification permission → paywall (skip) → Home → tip "Add a widget".
2. **Daily log (fastest path):** tap widget "+250 ml", which logs and refreshes the widget. No app open.
3. **From notification:** reminder → tap "+250 ml" action, which logs it.
4. **Fasting:** Settings → Fasting mode → choose Manual / Ramadan (location or city) / IF preset → reminders reschedule into the window.
5. **Upgrade:** tap locked widget theme → paywall → purchase → theme applied → ads removed.

---

## 8. Screens

1. Onboarding (4 steps)
2. Home / Today
3. Add drink (bottom sheet: drink type + amount)
4. Stats (charts, streak, calendar)
5. Widgets gallery (preview themes, how-to-add guide)
6. Fasting mode setup
7. Settings
8. Paywall
9. About / Privacy / Support

---

## 9. Technical requirements

### Stack
- **Expo** (managed, EAS Build) + **TypeScript** + **Expo Router**
- **Local storage:** `expo-sqlite` (+ Drizzle ORM) for logs; `react-native-mmkv` or AsyncStorage for settings
- **Notifications:** `expo-notifications` (local, scheduled)
- **Widgets:** `react-native-android-widget`
- **Animations:** built in code. Pip as SVG (`react-native-svg`) + `react-native-reanimated`; water wave with `@shopify/react-native-skia`. No Lottie files in v1 (see `animations.md`).
- **Charts:** `victory-native` or `react-native-gifted-charts`
- **Prayer times:** `adhan` (offline calculation)
- **Location (optional):** `expo-location` (coarse)
- **Payments:** `react-native-purchases` (RevenueCat)
- **Ads:** `react-native-google-mobile-ads` (AdMob + UMP consent)
- **Crash reporting:** Sentry (`@sentry/react-native`)
- **Analytics:** PostHog or Firebase Analytics (pick one; minimal events)
- **No backend in v1.** All data stays on the phone.

### Data model (local SQLite)
```
settings (key TEXT PRIMARY KEY, value TEXT)          -- goal, units, wake/sleep, reminder config, theme, fasting config
drinks   (id TEXT PK, name TEXT, factor REAL, icon TEXT, is_custom INTEGER, premium INTEGER)
cups     (id TEXT PK, amount_ml INTEGER, sort_order INTEGER)
logs     (id TEXT PK, ts INTEGER, date TEXT, amount_ml INTEGER, drink_id TEXT, effective_ml INTEGER)
daily    (date TEXT PK, goal_ml INTEGER, total_ml INTEGER, met INTEGER)   -- cached rollup for stats/streaks/widgets
```

### Non-functional requirements
- Works **fully offline**.
- Logging from widget/notification reflects in the app within 1s.
- Cold start < 2s on a mid-range Android phone.
- Android minSdk per current Expo default; target the latest required targetSdk for Play.
- Accessibility: large tap targets, screen-reader labels, sufficient contrast.
- Localization-ready (English first; Hindi, Arabic, Indonesian, Urdu, Turkish later for fasting markets). Supports RTL layouts.

### Analytics events (minimal)
`onboarding_completed`, `water_logged` (source: app/widget/notification), `goal_met`, `widget_added`, `fasting_enabled`, `paywall_shown`, `purchase_completed`, `reminder_tapped`.

---

## 10. Play Store & compliance checklist
- [ ] Privacy policy URL (hosted page) covering local storage, ads (AdMob), analytics, crash reporting, purchases.
- [ ] **Data safety form:** declare ad ID / device identifiers (AdMob), analytics and crash data; no personal health data leaves the device.
- [ ] Ads declaration = Yes. AdMob UMP consent for EEA/UK.
- [ ] Notification permission (Android 13+) requested with context.
- [ ] No exact alarm permission.
- [ ] Location: optional, coarse, with clear rationale; app works without it.
- [ ] Health claims: "stay hydrated" only; no medical claims; disclaimer in app and listing.
- [ ] Target audience: 13+ (avoid Families policy complexity).
- [ ] In-app "Delete all data" option.
- [ ] Closed testing: **12+ testers opted in for 14 continuous days** (recruit 18–20); collect feedback for the production access questionnaire.
- [ ] Content rating questionnaire completed.

---

## 11. Store listing (draft)
- **Title:** Pebblesip: Water Reminder
- **Short description:** Drink water reminder & tracker with aesthetic widgets and fasting mode
- **Screenshots (8):**
  1. "Little sips, every day" (Home + Pip)
  2. "Aesthetic widgets" (home-screen collage)
  3. "One tap from your home screen"
  4. "Reminders that never nag at night"
  5. "Fasting mode for Ramadan & IF"
  6. "Streaks & stats"
  7. "Dark & AMOLED themes"
  8. "No account needed. Your data stays on your phone"
- **Keywords to cover:** water reminder, drink water, water tracker, hydration, water widget, aesthetic widget, fasting water, ramadan water reminder, intermittent fasting hydration.

---

## 12. Milestones

| Day | Milestone |
|---|---|
| 1 | Project setup (Expo + TS + Router), design tokens, navigation |
| 2–3 | Onboarding + goal calc + local DB + Home logging + undo |
| 4–5 | Reminders (window, interval, auto-pause, notification action) |
| 6 | Fasting mode (manual + IF presets + Ramadan via adhan) |
| 7–8 | Widgets (small + medium, 1 free + 5 premium themes) |
| 9 | Stats + streaks + Pip states |
| 10 | RevenueCat paywall + AdMob + consent, Sentry, analytics; **upload to closed testing** |
| 10–24 | Closed test (14 days): bug fixes, polish, store assets, privacy policy, videos |
| ~25 | **Production launch** |

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Very crowded category | Widgets + fasting niche + strong keyword listing + short-video marketing |
| Android notification reliability (battery optimisation on Xiaomi/Oppo/Vivo) | In-app guide to disable battery optimisation; test on multiple brands |
| Widget library limitations in Expo | Prototype widgets on Day 1–2 to de-risk; fall back to simpler layouts |
| Low conversion | Fast iteration on paywall copy/price; rewarded ads as secondary revenue |
| Policy rejection (permissions, data safety) | Follow checklist (§10); no exact alarms; optional location only |
| Closed-test tester drop-off | Recruit 18–20; WhatsApp group; daily-use app helps engagement |

---

## 14. Open questions
1. Analytics: PostHog or Firebase? (Default: Firebase Analytics, since it pairs with AdMob.)
2. Mascot art: draw it yourself, commission an illustrator, or use a commercially licensed base and customise it?
3. Developer/studio name on Play Store?
4. Launch countries: worldwide, or start with India + a few fasting markets?
