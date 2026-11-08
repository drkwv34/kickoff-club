# Proposal

## Why

`GET /api/v1/me` returns the signed-in user, but there is no way to change `displayName` or `timezone` after registration. `PATCH /api/v1/me` currently returns 405, so the settings surface cannot persist profile edits.

## What Changes

- Add `PATCH /api/v1/me` for `displayName` and IANA-validated `timezone`, with the same double-submit CSRF protection as other mutating routes.
- Invalid timezone returns 400 with `fields.timezone`. Missing CSRF returns 403.
- Add a signed-in settings form that submits those fields.
- Registration timezone handling stays unchanged.
- Regression: authenticated PATCH `{ "timezone": "Europe/Madrid" }` → 200 and a following GET reflects it; invalid timezone → 400 with `fields.timezone`; missing CSRF → 403.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `auth`: `PATCH /api/v1/me` MUST update display name and IANA timezone for the authenticated user.
- `app-ui`: A signed-in settings form MUST let the user change display name and timezone.

## Impact

- `src/app/api/v1/me/route.ts`, auth domain/infra user update, validation schema.
- Settings page under `/app/settings` and a header link.
- Integration tests for success, invalid timezone, and missing CSRF.
