# Current Task

> One focused goal for the next ~2 hours. When it's done, clear this file and write the next task.
> Prompt: "Read @task_today.md and do only this task. Use @prd.md and @implementation_plan.md for context."

## Goal
Phase 3: onboarding (see `implementation_plan.md` → Phase 3).

## Requirements
- 4 skippable steps: welcome/Pip → weight/activity/climate → wake/sleep → units.
- Goal from `calcGoalMl` (prd.md §5.1) on an editable result screen, with "General guidance, not medical advice."
- Save to the `settings` table (goal via `setGoalMl`); an "onboarding complete" flag routes to Home on later launches.
- Android 13+ notification permission request with an explanation screen; denying still finishes onboarding.

## Out of scope for this task
- Home logging UI, reminders scheduling, paywall (just leave the route), widgets.

## Done when
- [ ] testing.md §1 Onboarding passes on the emulator
- [ ] `implementation_plan.md` Phase 3 boxes ticked
- [ ] Audit entry written in `audit.md`

## Reference files
- `prd.md`: §5.1 Onboarding, §7 flow 1
- `design/light/onboarding.jpg`, `design/dark/onboarding.png`
- `src/lib/goal.ts`, `src/lib/units.ts`, `src/db`
