# Spec Delta

## ADDED Requirements

### Requirement: Notification preference storage and APIs

Authenticated users SHALL read and update per-type in-app and email preferences via `GET` and `PATCH /api/v1/me/notification-preferences`. Missing rows MUST default both channels on. PATCH MUST require the same CSRF cookie and `X-CSRF-Token` header as other mutating `/api/v1` routes.

#### Scenario: Defaults are both channels on

- **WHEN** an authenticated user GETs `/api/v1/me/notification-preferences` with no stored rows
- **THEN** the response is HTTP 200
- **AND** every supported notification type has `inApp` true and `email` true

#### Scenario: Missing CSRF on preference update

- **WHEN** an authenticated client PATCHes `/api/v1/me/notification-preferences` without a matching CSRF token
- **THEN** the system responds with 403

### Requirement: Dispatcher honors channel preferences

When publishing a notification, the system MUST create the in-app row only if that type’s in-app preference is on, and MUST attempt email only if that type’s email preference is on. A disabled email channel MUST NOT prevent an enabled in-app row.

#### Scenario: Waitlist promotion with email disabled

- **WHEN** a user has disabled email for `waitlist_promoted` and is promoted from the waitlist
- **THEN** an in-app `waitlist_promoted` notification is created for that user
- **AND** no email is sent for that promotion
