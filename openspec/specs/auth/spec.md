# auth Specification

## Purpose

Session-based identity for kickoff-club: register, sign-in, sign-out, and authenticated API access using Postgres-backed sessions (no JWT).

## Requirements

### Requirement: User registration

The system SHALL register users with email, password (minimum 12 characters), display name, and IANA timezone. Email uniqueness SHALL be case-insensitive (`citext`). Passwords SHALL be stored with Argon2id hashing only.

#### Scenario: Successful registration

- **WHEN** a client posts valid registration fields to `POST /api/v1/auth/register`
- **THEN** the system creates a user and session and returns success with an HttpOnly session cookie

#### Scenario: Duplicate email

- **WHEN** registration uses an email that already exists (any casing)
- **THEN** the system responds with 409 `EMAIL_TAKEN`

### Requirement: Sign-in and sign-out

The system SHALL authenticate via `POST /api/v1/auth/login` and revoke sessions on `POST /api/v1/auth/logout` by setting `sessions.revoked_at`. Unknown email and wrong password SHALL return the same 401 message.

#### Scenario: Uniform invalid credentials

- **WHEN** login uses an unknown email or an incorrect password
- **THEN** the system returns the same invalid-credentials message with status 401

#### Scenario: Logout revokes session

- **WHEN** an authenticated user calls logout
- **THEN** subsequent `GET /api/v1/me` and protected routes reject the prior session cookie

### Requirement: Session cookies and TTL

Session cookies SHALL use name `kickoff_session` (HttpOnly, SameSite=Lax, Secure in production, Path=/). Idle TTL SHALL be 14 days (sliding on authenticated API use). Absolute TTL SHALL be 30 days from session creation. Only SHA-256 of the raw token SHALL be stored.

#### Scenario: Cookie flags in production

- **WHEN** `NODE_ENV` is production and a session is issued
- **THEN** `Set-Cookie` includes HttpOnly, SameSite=Lax, and Secure

### Requirement: CSRF protection

Mutating `/api/v1` routes SHALL require double-submit CSRF: cookie `kickoff_csrf` plus header `X-CSRF-Token`. `GET /api/v1/auth/csrf` SHALL expose a token paired with the CSRF cookie.

#### Scenario: Missing CSRF on mutation

- **WHEN** a mutating `/api/v1` request lacks a matching CSRF token
- **THEN** the system responds with 403

### Requirement: Current user endpoint

`GET /api/v1/me` SHALL return the authenticated user or reject missing, expired, or revoked sessions.

#### Scenario: Revoked session rejected

- **WHEN** a client presents a revoked session cookie
- **THEN** `GET /api/v1/me` rejects the request

### Requirement: Auth persistence foundation

The database SHALL provide `users` (uuid PK, unique `citext` email, `password_hash`, `display_name`, IANA `timezone`, timestamps) and `sessions` (uuid PK, `user_id` FK, unique `token_hash`, `expires_at`, `created_at`, nullable `revoked_at`) with indexes for token and user lookup. Process boot SHALL fail fast when `DATABASE_URL` or `SESSION_SECRET` (≥32 characters) is invalid.

#### Scenario: Migrations apply on fresh database

- **WHEN** migrations run on a fresh Postgres 16 database
- **THEN** `users` and `sessions` exist with the columns above and case-insensitive email uniqueness

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

### Requirement: Password reset request

The system SHALL accept `POST /api/v1/auth/password-reset` with an email and CSRF. When the email matches a user, it MUST store only a hash of a one-use token that expires in one hour and send exactly one email containing the raw token or a reset link. Known and unknown emails MUST return the same success response shape. An unknown email MUST NOT send mail.

#### Scenario: Known email receives a reset message

- **WHEN** a client posts a registered email to `POST /api/v1/auth/password-reset` with CSRF
- **THEN** the response is HTTP 200 with the same body shape used for unknown emails
- **AND** the mailer is invoked once to that address
- **AND** the message contains a reset token or link

#### Scenario: Unknown email is indistinguishable

- **WHEN** a client posts an unregistered email to `POST /api/v1/auth/password-reset` with CSRF
- **THEN** the response is HTTP 200 with the same body shape as a known email
- **AND** the mailer is not invoked

### Requirement: Password reset completion

The system SHALL accept a one-use token and a new password (minimum 12 characters) on `POST /api/v1/auth/password-reset/confirm` with CSRF. A valid token MUST update the password, mark the token used, revoke existing sessions for that user, and issue a new session so the user is signed in. A reused or expired token MUST return 410 or 400.

#### Scenario: Successful reset signs the user in

- **WHEN** a client confirms a valid unused token with a new password of at least 12 characters
- **THEN** the response is HTTP 200
- **AND** the user can authenticate with the new password
- **AND** a prior session cookie is rejected

#### Scenario: Reused or expired token is rejected

- **WHEN** a client submits a token that was already used or is past its expiry
- **THEN** the system responds with 410 or 400
- **AND** the password is unchanged
