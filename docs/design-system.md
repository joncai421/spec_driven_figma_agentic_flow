# Design System Mapping (Figma ↔ Code)

Source of truth for values: Figma variables. Source of truth for names in code: `src/styles/tokens.css`.
Agents add rows only for tokens they add in an approved task (citing the Figma variable).

## Naming rule
Figma `color/primary/500` → CSS `--color-primary-500` · `spacing/4` → `--space-4` · `radius/md` → `--radius-md`

## Breakpoints
| Name | min-width | Figma frame width |
|---|---|---|
| base | 0 | 375 |
| md | 768px | 768 |
| lg | 1024px | 1440 (scaled) |
| xl | 1280px | — |

## Token table
| Figma variable | CSS token | Value | Added in (spec/task) |
|---|---|---|---|
