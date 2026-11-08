# Current Task

> One focused goal for the next ~2 hours. When it's done, clear this file and write the next task.
> Prompt: "Read @task_today.md and do only this task. Use @prd.md and @implementation_plan.md for context."

## Goal
Phase 2: local data layer (see `implementation_plan.md` → Phase 2).

## Requirements
- Install expo-sqlite + Drizzle; create tables `settings`, `drinks`, `cups`, `logs`, `daily` (prd.md §9).
- Migrations + seed (water drink, 3 default cups: 150/250/500 ml).
- Query helpers: `addLog`, `undoLastLog`, `deleteLog`, `getToday`, `getRange`, `getStreak`.
- Day boundary handling (local midnight; timezone changes).
- Unit conversion helpers (ml ↔ oz).
- Jest unit tests for goal calc, streak calc and rollups.

## Out of scope for this task
- Any UI beyond what's needed to smoke-test the DB.
- Reminders, widgets, payments, ads, analytics.

## Before starting
- `git init` + first commit (from the Phase 1 audit).

## Done when
- [ ] Migrations run on a fresh install and seed data is present
- [ ] All query helpers covered by passing Jest tests
- [ ] `implementation_plan.md` Phase 2 boxes ticked
- [ ] Audit entry written in `audit.md`

## Reference files
- `prd.md`: §9 Technical requirements, §5.1 Goal formula
- `implementation_plan.md`: Phase 2
- `audit.md`: Phase 1 actions
