# Spec Delta

## ADDED Requirements

### Requirement: Profile update endpoint

Authenticated users SHALL update their `displayName` and/or `timezone` via `PATCH /api/v1/me`. Timezone values MUST be valid IANA identifiers. The route MUST require the same CSRF cookie and `X-CSRF-Token` header as other mutating `/api/v1` routes. Omitted fields MUST remain unchanged.

#### Scenario: Timezone update is persisted

- **WHEN** an authenticated client PATCHes `{ "timezone": "Europe/Madrid" }` to `/api/v1/me` with a valid CSRF token
- **THEN** the response is HTTP 200
- **AND** a following `GET /api/v1/me` returns `timezone` `Europe/Madrid`

#### Scenario: Invalid timezone is rejected

- **WHEN** an authenticated client PATCHes an invalid timezone to `/api/v1/me`
- **THEN** the response is HTTP 400
- **AND** the body includes `fields.timezone`

#### Scenario: Missing CSRF on profile update

- **WHEN** an authenticated client PATCHes `/api/v1/me` without a matching CSRF token
- **THEN** the system responds with 403
