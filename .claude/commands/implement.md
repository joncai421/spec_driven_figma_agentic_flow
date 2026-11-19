---
description: Orchestrate ONE task through the gated TDD loop (G1→G5)
argument-hint: <feature-slug> [task-id]
---
Arguments: $ARGUMENTS (feature slug, optional task id; default = first unchecked task)

You are the **orchestrator**. Delegate the work; verify the results; keep the main context small.

0. **Preflight** (stop on failure): spec APPROVED; task exists; `git status` noted; no unrelated dirty files
   (if there are, ask the human).
1. Load only: the task block, its ACs, and the relevant design.md rows.
2. **G1:** if the task touches UI and the design rows are missing or contain UNKNOWNs → delegate **figma-analyst** for the
   listed node IDs. Blocking UNKNOWN → stop and ask.
3. **G2 Red:** delegate **test-writer**. Then run the reported tests yourself and confirm they fail on assertions.
4. **G3 Green:** delegate **implementer**. Then run `npm run verify` yourself.
   Max 3 implementer loops; then stop with a handoff.
5. **G4 Visual** (UI tasks): delegate **visual-verifier**. Blocking items → back to implementer (max 2 loops).
6. **G5 Review:** delegate **reviewer**. FAIL → implementer fixes the blocking items → re-review (max 2 rounds).
7. **Close:** check the task in tasks.md, append the progress.md entry (session-control format), and print the gate
   summary with evidence. Recommend: "Review the diff, commit, then `/clear`." Do not commit or push yourself.
