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
