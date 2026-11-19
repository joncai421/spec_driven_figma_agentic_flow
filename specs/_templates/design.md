# <Feature name> — Design Facts
Spec-ID: <FEAT>
Figma file key: <KEY>
Extracted: <YYYY-MM-DD> via Figma MCP (tools: get_metadata, get_variable_defs, get_design_context, get_screenshot)
Rule: every value cites `figma:<nodeId>` or `figma-var:<name>`. Unobserved → section 8.

## 1. Frames per breakpoint
| Breakpoint | Frame name | Node ID | Figma width |
|---|---|---|---|
| mobile (base) | | | 375 |
| md ≥768 | | | |
| lg ≥1024 | | | |

## 2. Component inventory
| Component | Figma node | Reuse (path) / New (planned path) | Variants & states |
|---|---|---|---|

## 3. Tokens
| Figma variable | Value | Code token | Status |
|---|---|---|---|
| color/primary/500 | #1A73E8 | `--color-primary-500` | exists / NEW PROPOSAL |

## 4. Responsive behavior
| Element | Mobile (base) | md | lg | Source |
|---|---|---|---|---|
| Header nav | hamburger, drawer | same | inline links | figma:1:2 / figma:1:9 |

## 5. States & interactions
| Element | default | hover | focus-visible | active | disabled | loading | error | empty |
|---|---|---|---|---|---|---|---|---|

## 6. Assets
| Asset | Node ID | Format | Destination path |
|---|---|---|---|

## 7. Accessibility notes
<Landmarks, heading levels, labels, focus order, motion.>

## 8. Unknowns / gaps (DO NOT guess)
| # | Question | Blocking? | Answer (human) |
|---|---|---|---|

## 9. File plan
<Files to create/modify, grouped by task-to-be.>
