# Current Task

> One focused goal for the next ~2 hours. When it's done, clear this file and write the next task.
> Prompt: "Read @task_today.md and do only this task. Use @prd.md and @implementation_plan.md for context."

## Goal
Phase 4: Home / logging (see `implementation_plan.md` → Phase 4).

## Requirements
- Progress ring/fill + today's total vs goal + %.
- Skia water wave + level animation (see `animations.md`).
- Pip as SVG with basic motion (bob, blink, sip bounce).
- Quick-add buttons from `cups`; add-drink bottom sheet (drink + amount).
- Undo snackbar; today's log list with swipe-to-delete.
- Goal-met celebration (animation + haptic), once per day.
- Respect the saved volume unit (ml/oz).

## Before starting
- Primary colour decided: Stitch `#006A61` (`colors.primary`); Pastel Aqua `#7FD1C7` only as a brand accent.
- Remove the dev-only `[db] ready` log from `app/_layout.tsx` once Home shows real data.

## Out of scope for this task
- Reminders, widgets, stats charts, paywall, ads.

## Done when
- [ ] testing.md §2 Logging passes on the emulator (incl. survives app kill, midnight reset)
- [ ] `implementation_plan.md` Phase 4 boxes ticked
- [ ] Audit entry written in `audit.md`

## Reference files
- `prd.md`: §5.2 Home, §5.8 Pip
- `animations.md`
- `design/light/home.jpg`, `design/light/home-goal-reached.jpg`, `design/light/add-drink-sheet.jpg`, `design/dark/home.png`
- `src/db/queries.ts`
