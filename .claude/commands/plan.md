---
description: Create tasks.md for an APPROVED spec
argument-hint: <feature-slug>
---
Feature: $ARGUMENTS

1. Verify `specs/$ARGUMENTS/requirements.md` has `Status: APPROVED`. If not, stop.
2. If design.md still has blocking UNKNOWNs, list them and stop.
3. Using the spec-writing skill's tasks.md rules, write `specs/$ARGUMENTS/tasks.md`.
   Every AC must be covered by at least one task. Include an AC coverage table at the end.
4. Reply with the task list and ask the human to confirm before running `/implement $ARGUMENTS`.
