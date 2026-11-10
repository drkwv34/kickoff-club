# Tasks

## 1. Regression coverage

- [x] 1.1 Add Playwright tests at 390×844 and 375-wide viewports asserting `document.documentElement.scrollWidth <= clientWidth` for a signed-in user. Confirm they fail on the current header.

## 2. Header layout

- [x] 2.1 Collapse or wrap the primary nav at ≤390px so both viewports pass 1.1, and capture a 390×844 screenshot of the header.

## 3. Validation

- [x] 3.1 Run `openspec validate fix-mobile-header-layout --strict` and confirm it exits 0.
