# Spec Delta

## ADDED Requirements

### Requirement: Mobile header e2e asserts no horizontal overflow

The system SHALL provide Playwright tests at 390×844 and 375-wide viewports that a signed-in session has `document.documentElement.scrollWidth <= clientWidth`.

#### Scenario: No horizontal overflow at 390 and 375

- **WHEN** a registered user opens the app at 390×844 and at 375px width
- **THEN** each viewport reports `scrollWidth` less than or equal to `clientWidth`
