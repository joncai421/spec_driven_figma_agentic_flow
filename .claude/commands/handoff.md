---
description: Persist session state to progress.md so the context can be cleared safely
argument-hint: <feature-slug>
---
Append a handoff entry to `specs/$ARGUMENTS/progress.md` using the session-control skill format.
Base it only on evidence from this session (commands actually run, files actually changed via `git status`).
Then tell the user: "State saved. Safe to `/clear`."
