# Current Task

> One focused goal for the next ~2 hours. When it's done, clear this file and write the next task.
> Prompt: "Read @task_today.md and do only this task. Use @prd.md and @implementation_plan.md for context."

## Goal
Phase 9: monetization (see `implementation_plan.md` → Phase 9).

## Requirements
- See `implementation_plan.md` → Phase 9 and `prd.md` (monetization section) for the full list.

## Status (2026-11-13)
- Code complete. Waiting on accounts: follow `docs/monetization-setup.md`, then run testing.md §7 and the EEA consent check.

## Notes
- Replace the `usePremium()` / `isPremium()` stub with the real entitlement; keep the dev "Pretend Premium" switch dev-only.
- After purchase, restore or expiry: call `syncReminders()` and `refreshWidgets()` so reminders and widgets pick up Premium.
- Paywall entry points already route to `/paywall` (fasting, widgets, stats).

## Done when
- [ ] testing.md §7 Premium & purchases passes (license tester)
- [ ] `implementation_plan.md` Phase 9 boxes ticked
- [ ] Audit entry written in `audit.md`

## Reference files
- `prd.md`: monetization
- `design/light/paywall.jpg` (if present)
