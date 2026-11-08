# Pebblesip: Animation Spec

All animations are **built in code** (no Lottie or animator needed for v1).
Tools: `react-native-svg` (Pip shapes) · `react-native-reanimated` (motion) · `@shopify/react-native-skia` (water wave, particles) · `expo-haptics`.

## Pip states
Pip is an SVG built from these parts: body (gradient `#8FD9CC` → `#5FC2B4`), highlight, eyes, mouth, blush.

| State | Progress | Motion |
|---|---|---|
| Sleepy | 0–25% | Slow breathing (scale 1.0 ↔ 1.03, 3s loop), half-closed eyes, faint "z" every ~5s |
| Okay | 25–75% | Idle bob (translateY ±4px, 2.5s loop), blink every ~4s (eye scaleY 1 → 0.1 → 1, 120ms) |
| Happy | 75–99% | Bigger smile, stronger blush, small hop every ~6s |
| Glowing | 100% | Soft glow pulse (opacity 0.4 ↔ 0.8), 3 twinkling sparkles |
| On sip (event) | any | Squash & stretch (scaleY 0.85 → 1.1 → 1, ~350ms spring) + a small droplet falls into Pip |

## Home
- **Water wave (Skia):** sine wave path, continuous slow drift; level animates to the new % over ~600ms (ease-out).
- **Count-up:** total number tweens from old to new value (~500ms).
- **Quick-add press:** scale 0.95 on press-in, spring back; light haptic.
- **Goal reached:** droplet/confetti burst (Skia particles, ~1.2s), Pip → Glowing, success haptic, % badge turns mint. **Once per day.**
- **Undo snackbar:** slide up 200ms; auto-hide after 4s.
- **Log list:** new item enters from top (Reanimated layout animation); swipe-to-delete collapses smoothly.

## Other screens
- **Onboarding:** Pip tilts and hops on Welcome (no arm wave), reacts to choices (e.g., a sweat drop on "Hot"), celebrates on "Your goal".
- **Stats:** bars grow from 0 (staggered 40ms each); streak flame gentle flicker.
- **Widgets gallery:** cross-fade preview when switching themes.
- **Paywall:** sparkles twinkle around glowing Pip; selected plan border animates in.
- **Navigation:** quick fade/slide (~200ms).

## Home-screen widgets
Android widgets **cannot animate**. They update to the new static state instantly.

## Rules
- **Reduce motion:** if the system "remove animations" setting is on, show static Pip states, a static water level and no particles.
- Durations: 150–400ms for UI; celebrations ≤ 1.5s; never block input.
- Pause the wave and idle loops when the screen is not focused (battery).
- Target 60fps on a mid-range Android phone; test on a real device.

## Build phases
- **Phase 4 (Home):** Skia wave + basic Pip (bob, blink, sip bounce), count-up, button feedback, haptics.
- **Phase 10 (Polish):** all 4 Pip moods, goal celebration, onboarding reactions, Stats bars, Paywall sparkles, reduce-motion fallback.
