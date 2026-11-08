# Spec Delta

## ADDED Requirements

### Requirement: Forgot and reset password pages

The UI SHALL provide `/forgot-password` to request a reset email and `/reset-password` to set a new password from a token. `/login` MUST include a visible "forgot password" link to `/forgot-password`. Forms MUST pair each input with a visible label.

#### Scenario: Login links to forgot password

- **WHEN** an unauthenticated user opens `/login`
- **THEN** the page includes a link to `/forgot-password`

#### Scenario: Forgot-password form

- **WHEN** a user opens `/forgot-password`
- **THEN** the page shows a labeled email field and a submit control

#### Scenario: Reset-password form

- **WHEN** a user opens `/reset-password`
- **THEN** the page shows a labeled new-password field and a submit control
