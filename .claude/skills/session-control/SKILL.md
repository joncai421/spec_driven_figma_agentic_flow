---
name: session-control
description: Use to manage context size and continuity — when starting/ending a task, when the conversation grows long, before /compact or /clear, or when resuming work. Defines handoff format and context budget rules.
---

# Session Control

## Principles
- Context is a budget. Large irrelevant context degrades accuracy and increases hallucination.
- State lives in **files** (specs, tasks.md, progress.md), not in the conversation.
- The SessionStart hook re-injects state after `/clear` and after compaction.

## Rules
1. **One task per session.** Start: read the task block, its ACs and the relevant design.md rows only.
   End: `/handoff` → `/clear`.
2. **Delegate heavy reads** to subagents (figma-analyst, reviewer, visual-verifier). They return summaries
   of ≤ ~40 lines. Their raw output stays out of the main thread.
3. **Read narrowly:** grep first, then read specific line ranges. Avoid re-reading files you already summarized.
4. **Figma:** `get_metadata` first. `get_design_context` only on small nodes. Persist the facts to design.md once.
5. **Long sessions:** if the conversation is long, a task spans many fix loops, or you notice you are
   re-reading things, run `/handoff`, then either `/clear` (preferred) or
   `/compact keep: current task, gate status, failing test names, next step`.
6. **Stuck detection:** after 3 failed fix attempts on the same error, stop. Write a handoff with a
   hypothesis list and ask the human. Do not thrash.

## Handoff entry format (appended to specs/<feature>/progress.md)
### <YYYY-MM-DD HH:MM> — <Task ID> — <in-progress|done|blocked>
- Did: <bullets>
- Evidence: <commands + results, e.g. "npm run verify → all pass">
- Gates: G1 ✅ G2 ✅ G3 ✅ G4 ⏳ G5 ⏳
- Next step (exact, actionable): <…>
- Open questions / blockers: <…>
- Files touched: <paths>
