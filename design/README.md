# Design (from Stitch)

Source: Stitch project **Pebblesip Water Reminder UI** (`14795355675889850525`), pulled 2026-11-08. Screenshots only; Stitch HTML is reference, not shipped code.

- `brand/`: app icon (sea-glass Pip), Pip mascot
- `light/`: home, home-goal-reached, add-drink-sheet, onboarding, stats, widgets, fasting, settings, paywall
- `dark/`: home, onboarding, stats, settings, paywall
- `marketing/`: Android widget showcase
- `tokens.json`: colours (light/dark), type scale, spacing, radius. Mirrored in `src/theme/`.

Note: Stitch's light `primary` (#006A61) is darker than PRD Pastel Aqua (#7FD1C7); Pastel Aqua is kept as a `brand` token and is close to `primaryContainer` (#4FBFB1). The dark set has no Widgets or Fasting screen yet.
