---
name: figma-extract
description: Use whenever Figma designs are involved. Extracts verified design facts (frames per breakpoint, tokens, components, states, spacing, typography) via Figma MCP into specs/<feature>/design.md with node-ID citations. Prevents hallucinated design values and controls context size.
---

# Figma Extraction (anti-hallucination)

## Hard rules
1. **Preflight:** confirm the Figma MCP tools are available. If they are not, or auth fails, **STOP** and tell
   the human. Never reconstruct designs from memory, file names, or guesses.
2. Every value written to design.md has a source: `figma:<nodeId>` or `figma-var:<variableName>`.
3. Values you didn't observe are written as `UNKNOWN` in "Unknowns / gaps", with a concrete question.
4. MCP-generated code (often React + Tailwind with absolute values) is a **reference only**. Never paste it.
5. Context budget: never request `get_design_context` for a whole page. Large output → summarize and discard.

## URL parsing
`https://www.figma.com/design/<FILE_KEY>/<name>?node-id=12-345` → fileKey `<FILE_KEY>`, nodeId `12:345`.

## Procedure
1. `get_metadata` on the top-level frame(s). This is a cheap structural map: names, node IDs, sizes.
2. Identify the frame for each breakpoint (mobile ≈ 375, tablet ≈ 768, desktop ≈ 1280/1440).
   - If a breakpoint frame is missing, record its behavior as `UNKNOWN`. Do NOT extrapolate desktop from mobile.
3. `get_variable_defs` on the relevant frames → the design tokens actually used.
4. Map each Figma variable to a code token. Grep `src/styles/tokens.css` and use `docs/design-system.md`.
   - Match found → record the mapping.
   - No match → record it as `NEW TOKEN PROPOSAL` (name + value + figma var). Do not hard-code.
5. `get_code_connect_map`, if available → existing code components linked to Figma components.
   Also grep `src/components/` for reuse candidates by name and role.
6. `get_design_context` **per component node** (small subtrees). Extract layout intent (stack, grid,
   alignment, gap), sizes, typography token, color token, radius, shadow, and states/variants.
7. `get_screenshot` per breakpoint frame, to see the visual truth. Note the node IDs so the visual-verifier
   can re-fetch them later.
8. Convert absolute layouts to intent: "vertical stack, gap = space-4, full-width button pinned to
   bottom on mobile; two-column grid at lg". Use Auto Layout data where present.
9. Fill design.md sections 1–9. Summarize. Return to the caller: the file path, the number of UNKNOWNs,
   and the token proposals.

## Output checklist
- [ ] Frames table with node IDs for every breakpoint (or UNKNOWN)
- [ ] Component inventory with reuse vs. new decision and file path
- [ ] Token table: every color, spacing, radius, typography and shadow value used is mapped or proposed
- [ ] Responsive behavior table per element per breakpoint
- [ ] States: default, hover, focus-visible, active, disabled, loading, empty, error (or "not designed" → UNKNOWN)
- [ ] Assets listed (icons, images) with node IDs and export format
