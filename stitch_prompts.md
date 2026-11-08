# Pebblesip: Stitch Prompts

How to use:
1. Paste the **Base style prompt** first (or prepend it to every screen prompt) so all screens match.
2. Generate one screen per prompt. Choose **Mobile** as the device.
3. Iterate with short follow-ups ("make the buttons larger", "use more white space").
4. Export to Figma or code when happy.

---

## 0. Base style prompt (use for every screen)

```
Design a mobile app UI for "Pebblesip", a calm, cute water reminder app for Android.
Style: soft, minimal, "zen pebble" aesthetic. Lots of white space, rounded shapes, gentle and friendly.
Colors (light mode): background cream #F6F1E7, cards white #FFFFFF, primary aqua #4FBFB1, light aqua #7FD1C7, mint success #9BE3C9, stone grey #A8A39A, main text dark stone #3D3A36, secondary text #8C877F.
Typography: Nunito (rounded) for headings and big numbers, Inter for body text.
Shapes: card corner radius 24px, pill-shaped buttons, soft subtle shadows, no harsh borders.
Icons: rounded line icons (Lucide/Phosphor style).
Mascot: "Pip", an original small smooth round grey pebble with a glossy water-shine highlight, two dot eyes and a tiny smile. Flat vector style, simple and cute.
Bottom navigation with 4 tabs: Home, Stats, Widgets, Settings.
Tone: positive and gentle microcopy. No red warnings.
Android Material 3 layout conventions, 8px spacing grid, 20–24px screen margins.
```

---

## 1. App icon

> Stitch is built for UI screens. If the icon result is weak, use the same prompt in an image tool (Gemini, Ideogram, etc.) and then redraw it as clean vector in Figma.

```
Design an Android app icon for "Pebblesip", a water reminder app.
A single smooth, slightly oval, rounded grey pebble (#A8A39A), slightly tilted, centered, with one glossy cream-white water highlight on the top left, two small dot eyes and a tiny calm smile.
Background: soft vertical gradient from aqua #7FD1C7 to mint #B8E8DF.
A subtle soft shadow under the pebble. Flat vector style, minimal, no text, no water drops around, no extra elements.
Must be clearly readable at small sizes (48px). Square canvas 1024x1024 with the main shape inside the central safe zone for Android adaptive icons.
Also show a monochrome outline version of the pebble for Android themed icons.
```

---

## 2. Onboarding (4 screens)

```
Using the Pebblesip style, design a 4-step onboarding flow for a water reminder app, one question per screen, with a progress indicator (4 dots) at the top and a large pill "Continue" button at the bottom.
Screen 1 (Welcome): Pip the pebble mascot large in the center, waving. Title "Hi, I'm Pip!" Subtitle "Little sips, every day. Let's set your daily water goal."
Screen 2 (About you): weight input with kg/lb toggle, activity level as 3 selectable cards (Low, Moderate, High) with simple icons, climate as 3 chips (Cool, Mild, Hot).
Screen 3 (Your day): wake-up time and bedtime pickers shown as two large rounded cards with sun and moon icons. Caption "I'll only remind you while you're awake."
Screen 4 (Your goal): big number "2,550 ml" with an edit pencil, Pip looking happy, a ml/oz toggle, and small grey text "General guidance, not medical advice." Button "Start sipping".
```

---

## 3. Home / Today screen

```
Using the Pebblesip style, design the Home screen.
Top bar: "Good morning ☀️" on the left and a small streak badge "🔥 5" on the right.
Center: a large circular card showing a water level that fills from the bottom with a soft wave (aqua gradient), with Pip the pebble sitting in the water. Inside/below: "1,250 / 2,300 ml" in big Nunito numbers and "54%" below.
Below: three large pill quick-add buttons "+150 ml", "+250 ml", "+500 ml", and a secondary outlined pill "+ Other drink".
Section "Today": a list of log entries in white rounded cards, e.g. "09:10 · Water · 250 ml", "11:40 · Coffee · 200 ml", each with a small drink icon.
Bottom navigation: Home (active), Stats, Widgets, Settings.
Calm, airy, lots of white space.
```

### 3b. Home: goal completed state
```
Same Home screen, but the goal is completed: the circle is full, Pip is glowing with small sparkles around it, text "Goal reached! Pip is shining ✨", total "2,350 / 2,300 ml" and "100%". Soft mint accents.
```

---

## 4. Add drink bottom sheet

```
Using the Pebblesip style, design a bottom sheet for adding a drink over the Home screen (dimmed background).
Title "Add a drink". A horizontal row of drink chips with icons: Water, Tea, Coffee, Milk, Juice, Coconut water (some chips show a small lock icon for premium).
Amount selector: large number "250 ml" with minus/plus round buttons and a horizontal slider.
Cup size presets as small pills: 150, 250, 350, 500.
Full-width pill button "Add 250 ml".
```

---

## 5. Stats screen

```
Using the Pebblesip style, design the Stats screen.
Top: a streak card "🔥 5-day streak" with "Best: 12 days".
A segmented control: Week / Month / Year.
A rounded bar chart for 7 days (Mon–Sun) with aqua bars and a dashed goal line; today's bar highlighted.
Two small stat cards side by side: "Daily average 2,140 ml" and "Goals met 5/7".
A calendar heatmap card for the month with soft aqua dots (darker = more water), with a small lock badge "Premium".
A small banner ad placeholder at the very bottom above the navigation bar (simple grey rounded rectangle labeled "Ad").
Bottom navigation: Stats active.
```

---

## 6. Widgets gallery screen

```
Using the Pebblesip style, design a "Widgets" screen that showcases home-screen widget themes.
Title "Make your home screen yours". A card at the top "How to add a widget" with a small illustration and a "Show me" button.
A 2-column grid of widget theme previews, each preview showing a small square widget with a water progress fill, "54%" and a round "+" button:
1. Pastel Aqua (Free, selected)
2. Zen Stone (beige/stone texture)
3. Glass (frosted translucent over a colorful wallpaper)
4. Matcha (soft green)
5. Night (AMOLED black with aqua glow)
6. Ocean (deep blue gradient)
7. Sakura (soft pink)
Premium themes show a small lock badge. Below the grid: "Custom accent color" row with color swatches.
Bottom navigation: Widgets active.
```

---

## 7. Home-screen widget designs (for reference)

```
Design Android home-screen widgets for the Pebblesip water reminder app, shown on a realistic phone home screen with an aesthetic wallpaper.
Small widget (2x2): rounded square, a pebble-shaped container filling with aqua water, "54%" in the center, and a small round "+" button in the corner. Caption "1,250 ml".
Medium widget (4x2): Pip the pebble mascot on the left; on the right "1,250 / 2,300 ml", a rounded progress bar, "Last sip 11:40", and three small chips "+150", "+250", "+500".
Show each widget in 3 themes: Pastel Aqua, Glass (frosted translucent), and Night (black with aqua glow).
```

---

## 8. Fasting mode screen

```
Using the Pebblesip style, design a "Fasting mode" settings screen.
Top: a toggle "Fasting mode" with a moon icon and caption "I'll only remind you during your eating window."
Mode selector as 3 cards: "Manual window", "Intermittent fasting" (chips 16:8, 18:6, 20:4, OMAD), "Ramadan" (moon & star icon, Premium badge).
A visual 24-hour timeline bar showing the eating window highlighted in aqua (e.g., 18:30 → 04:30) and the fasting hours in soft grey.
For Ramadan: rows "Location: Mumbai" with change link, "Calculation method", and "Suhoor plan: 2 glasses before Fajr" toggle.
Today's plan card: "Drink 2,300 ml between 18:30 and 04:30, about 300 ml every hour."
```

---

## 9. Settings screen

```
Using the Pebblesip style, design the Settings screen as grouped rounded cards.
Card "Premium": Pip glowing with "Go Premium" button (or "Premium active ✓").
Group "Goal & units": Daily goal 2,300 ml, Units ml/oz, Cup sizes.
Group "Reminders": Reminders toggle, Interval "Every 60 min", Wake-up 07:00, Bedtime 23:00, "Fix missed reminders (battery settings)".
Group "Fasting mode": status "Off".
Group "Appearance": Theme Light/Dark/System, Widget theme.
Group "Data": Export CSV (premium lock), Delete all data (in muted text, not red).
Group "About": Rate Pebblesip, Contact support, Privacy policy, Version 1.0.0.
Bottom navigation: Settings active.
```

---

## 10. Paywall

```
Using the Pebblesip style, design a Premium paywall screen.
Top: a close "X" in the corner. Pip glowing with sparkles over a soft aqua gradient header. Title "Pebblesip Premium". Subtitle "More calm, more cute, no ads."
Benefits list with check icons: "All aesthetic widget themes", "Ramadan & intermittent fasting modes", "Smart reminders that adapt to you", "Full stats, calendar & export", "No ads, ever".
Three plan cards stacked: "Yearly $9.99 / year: Best value, 3-day free trial" (highlighted with aqua border and a "Most popular" tag), "Monthly $1.99 / month", "Lifetime $14.99 one-time".
Full-width pill button "Start free trial". Small text links below: "Restore purchases · Terms · Privacy".
```

---

## 11. Notification & dark mode variants

```
Show the Pebblesip Home screen in dark mode: background #121414, cards #1C1F1F, primary aqua #6FD6C8, text #ECEAE6, same layout, water glow effect slightly brighter.
Also show an Android notification design: small Pebblesip icon, title "Time for a sip 💧", text "You're at 54%. Pip is getting shiny!", action buttons "+250 ml" and "Snooze".
```
