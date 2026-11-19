# <Feature name> — Tasks
Spec-ID: <FEAT>
Rules: one task = one session · tests first · each task closes only with gate evidence.

- [ ] T01 — <Add missing tokens from design.md §3>
  - ACs: —
  - Tests (first): <n/a or token presence test>
  - Files: src/styles/tokens.css, docs/design-system.md
  - Figma: —
  - Done when: verify passes · reviewer PASS

- [ ] T02 — <Component X: mobile base layout + states>
  - ACs: FEAT-AC-01, FEAT-AC-03
  - Tests (first): src/features/<f>/X.test.tsx
  - Files: src/features/<f>/X.tsx
  - Figma: 12:345
  - Done when: red logged · green · verify · G4 visual PASS · reviewer PASS

- [ ] T03 — <Page composition + responsive e2e (md/lg)>
  - ACs: FEAT-AC-02
  - Tests (first): e2e/<f>.spec.ts
  - Files: …
  - Figma: 12:400
  - Done when: …

## AC coverage
| AC | Task(s) |
|---|---|
