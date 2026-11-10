# Spec Delta

## ADDED Requirements

### Requirement: Header fits narrow viewports

The primary header navigation SHALL wrap or collapse at viewports 390px wide and below so the document does not overflow horizontally. Controls remain reachable without horizontal scrolling.

#### Scenario: Signed-in header at 390 by 844

- **WHEN** a signed-in user opens the app at a 390×844 viewport
- **THEN** `document.documentElement.scrollWidth` is less than or equal to `clientWidth`

#### Scenario: Signed-in header at 375 width

- **WHEN** a signed-in user opens the app at a 375px-wide viewport
- **THEN** `document.documentElement.scrollWidth` is less than or equal to `clientWidth`
