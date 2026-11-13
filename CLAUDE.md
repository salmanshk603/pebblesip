# Pebblesip: Working rules for AI assistants

Read these before doing anything:
1. `prd.md`: what we're building and **what NOT to build** (§6 Out of scope).
2. `implementation_plan.md`: the phased roadmap. Work on **one phase/task at a time**.
3. `task_today.md`: the current focused task. Do only this unless told otherwise.

Workflow rules:
- Never add features that are not in `prd.md`. If something seems missing, ask first.
- After finishing a phase, tick the boxes in `implementation_plan.md` and write an entry in `audit.md`.
- For bugs: log them in `bugs.md`, state a hypothesis and fix plan **before** changing code.
- Before calling a feature done, check the matching section of `testing.md`.
- Stack: Expo + TypeScript + Expo Router, local SQLite, no backend in v1.
- Android policy: never request exact-alarm permissions; location is optional and coarse; no medical claims.


# Mobile Development Rules

## General
- Inspect only files relevant to the current task.
- Never scan the entire project unnecessarily.
- Avoid reading generated files and dependencies.
- Do not rewrite working code.
- Make the smallest possible changes.
- Avoid unnecessary explanations.

## Development
- Follow existing project architecture.
- Reuse existing components.
- Keep UI components modular.
- Avoid unnecessary dependencies.
- Follow existing naming conventions.

## Debugging
- Identify the root cause before changing code.
- Don't make speculative changes.
- Run only relevant tests.
- Don't repeatedly inspect unchanged files.

## Communication
- Give concise progress updates.
- Summarize changed files.
- Mention errors only when relevant.
- Don't repeat previously established context.
