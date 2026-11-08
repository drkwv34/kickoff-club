# Spec Delta

## ADDED Requirements

### Requirement: Settings profile form

Signed-in users SHALL have a settings page with a form to change display name and timezone. Each input MUST have a visible label. Submitting valid values MUST persist them through `PATCH /api/v1/me`.

#### Scenario: Signed-in user opens settings

- **WHEN** an authenticated user opens `/app/settings`
- **THEN** the page shows labeled display name and timezone fields
- **AND** a primary navigation link to settings is available
