# <Feature name> — Requirements
Spec-ID: <FEAT>
Status: DRAFT
Figma: <url(s)>
Owner: <name>
<!-- Spec-ID: short UPPERCASE, used in AC IDs and test names -->
<!-- Status lifecycle: DRAFT → APPROVED (human only) → DONE -->

## 1. Goal
<One paragraph: user problem and outcome.>

## 2. Users & context
<Who, on which devices, in which situation.>

## 3. Acceptance criteria (EARS)
| ID | Criterion | Breakpoints | Verify by | Source |
|---|---|---|---|---|
| FEAT-AC-01 | WHEN the user submits the form with an empty email, THE SYSTEM SHALL show "Email is required" below the email field and move focus to it. | all | unit | figma:12:345 |
| FEAT-AC-02 | WHERE viewport ≥ 1024px, THE SYSTEM SHALL display the form and illustration side by side. | lg+ | e2e | figma:12:400 |

## 4. Non-functional
- Accessibility: WCAG 2.2 AA; full keyboard operation; visible focus
- Mobile: touch targets ≥ 44×44px; no horizontal scroll from 320px width
- Performance: <e.g. no layout shift on load for this view>

## 5. Out of scope
- <…>

## 6. Assumptions (must be confirmed by a human)
- <…>

## 7. Open questions
- <…>

## Change log
- <date> — created (DRAFT)
