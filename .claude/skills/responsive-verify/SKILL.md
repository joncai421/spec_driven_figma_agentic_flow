---
name: responsive-verify
description: Use to verify implemented UI against Figma at mobile, tablet and desktop viewports using Playwright MCP and Figma MCP screenshots plus computed-style measurement. Produces a discrepancy report (gate G4).
---

# Responsive Visual Verification

## Setup
- Ensure the dev server is running (`npm run dev`). Note the URL from its output; do not assume the port.
- You need the Figma node IDs per breakpoint from design.md § Frames.

## Per viewport (375×812, 768×1024, 1280×800)
1. Playwright MCP: resize the browser → navigate to the route/story → wait for the network to be idle → take a screenshot.
2. Figma MCP: `get_screenshot` for the matching frame node, if it exists. If it doesn't, verify against
   the design.md responsive behavior table only.
3. Compare, checklist style:
   - layout structure and order; alignment; stacking/columns
   - spacing (gaps, padding); sizes of key elements
   - typography (size, weight, line height); colors (tokens)
   - visibility of elements per breakpoint
   - overflow: `document.documentElement.scrollWidth <= innerWidth`
4. Measure, don't eyeball, for key elements. Use Playwright evaluate to read `getComputedStyle` and
   `getBoundingClientRect`, and compare with design.md values.
5. Check interaction states that the design specifies (focus-visible, hover on desktop, disabled, error).

## Report (returned to the orchestrator)
| Viewport | Element | Expected (source) | Actual (measured) | Severity |
Severity: **blocking** (wrong layout/color/missing element/overflow) · **minor** (≤ 2px drift, subpixel
font rendering) · **design-gap** (Figma lacks info → UNKNOWN question).

Never claim "pixel-perfect". State what was measured. Verdict: PASS (no blocking) / FAIL.
