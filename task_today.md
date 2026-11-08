# Current Task

> One focused goal for the next ~2 hours. When it's done, clear this file and write the next task.
> Prompt: "Read @task_today.md and do only this task. Use @prd.md and @implementation_plan.md for context."

## Goal
Phase 5: reminders (see `implementation_plan.md` → Phase 5).

## Requirements
- Schedule local notifications between wake and sleep time at the chosen interval.
- Notification action "+250 ml" logs without opening the app.
- Auto-pause when the goal is met; reschedule on settings change and app start.
- **No exact-alarm permission.**
- Battery-optimisation help screen (Xiaomi/Oppo/Vivo/Samsung guidance).
- Premium hooks (smart pacing, quiet hours, snooze) behind a feature flag.

## Before starting
- Move `REMINDER_CHANNEL_ID` from `app/(onboarding)/notifications.tsx` into `src/features/reminders`.

## Out of scope for this task
- Fasting windows (Phase 6), widgets, stats, paywall.

## Done when
- [ ] testing.md §3 Reminders passes on the emulator (and ideally the phone)
- [ ] `implementation_plan.md` Phase 5 boxes ticked
- [ ] Audit entry written in `audit.md`

## Reference files
- `prd.md`: §5.4 Smart reminders
- `src/db/queries.ts`, `src/features/onboarding/onboarding.ts` (wake/sleep keys)
