# Code Conventions (human-owned; agents follow)

## Structure
- `src/components/` shared, presentational, reusable (no feature logic)
- `src/features/<feature>/` feature components, hooks, tests co-located (`X.tsx`, `X.test.tsx`)
- `e2e/` Playwright specs, one file per feature: `<feature>.spec.ts`
- `src/styles/tokens.css` design tokens (CSS custom properties)

## Components
- Function components, typed props interface `XProps`, named exports
- Props for variants (`variant`, `size`) mapped from Figma component properties
- No inline styles except dynamic values. No raw colors (token guard enforces this)

## Responsive (mobile-first)
- Base = mobile. Enhance with min-width breakpoints: md 768 · lg 1024 · xl 1280
- Layout via flex/grid + gap tokens. No absolute positioning for layout
- Images: responsive (`max-width:100%`, `srcset` where provided)
- Touch targets ≥ 44px. Hover is never the only affordance

## Accessibility
- Semantic elements first. Every interactive element has an accessible name
- `:focus-visible` styles from tokens. Respect `prefers-reduced-motion`

## Tests
- AC-tagged names `[FEAT-AC-NN]`. Role-based queries. No DOM snapshots
