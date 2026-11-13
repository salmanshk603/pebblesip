# Current Task

> One focused goal for the next ~2 hours. When it's done, clear this file and write the next task.
> Prompt: "Read @task_today.md and do only this task. Use @prd.md and @implementation_plan.md for context."

## Goal
Phase 6: fasting mode (see `implementation_plan.md` → Phase 6).

## Requirements
- Manual eating window (free): reminders only inside the window; goal spread across the window.
- IF presets 16:8 / 18:6 / 20:4 / OMAD (Premium).
- Ramadan mode: `adhan` prayer times from coarse location or a manual city; method selector (Premium).
- Suhoor pre-dawn reminder sequence (Premium).

## Notes
- Reminder windows come from `src/features/reminders/plan.ts` (`planReminders`); fasting supplies a different window. Windows crossing midnight are already supported.
- Location must be optional and coarse; the app must work with it denied (manual city).

## Out of scope for this task
- Widgets, stats, paywall (Premium parts stay behind `usePremium()` / feature flags).

## Done when
- [ ] testing.md §4 Fasting mode passes on the emulator
- [ ] `implementation_plan.md` Phase 6 boxes ticked
- [ ] Audit entry written in `audit.md`

## Reference files
- `prd.md`: §5.5 Fasting mode
- `design/light/fasting.jpg`
