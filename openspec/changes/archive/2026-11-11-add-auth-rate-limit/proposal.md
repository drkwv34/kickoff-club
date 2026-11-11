# Proposal

## Why

Login, register, password reset, and invite endpoints have no request throttle. FR-ERR-002 requires HTTP 429 with a standard error body, but repeated failed logins currently keep returning 401, which leaves credential stuffing and invite/reset mail spam unmitigated.

## What Changes

- Add an in-memory rate limiter on `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/password-reset`, `POST /api/v1/auth/password-reset/confirm`, `POST /api/v1/groups/:id/invites`, and `POST /api/v1/invites/:code/accept`.
- When a client exceeds the limit, respond with HTTP 429, code `RATE_LIMITED`, the standard `{ code, message, details? }` error shape, and a `Retry-After` header.
- Regression: N+1 failed logins from the same client return 429 `RATE_LIMITED` with `Retry-After`.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `auth`: Login, register, and password-reset mutations MUST return 429 `RATE_LIMITED` with `Retry-After` after too many attempts from the same client.
- `groups`: Invite create and accept MUST return the same 429 `RATE_LIMITED` shape after too many attempts from the same client.

## Impact

- `src/lib/http/` limiter + `handleApi` Retry-After mapping; `DomainErrorCode.RATE_LIMITED`.
- Auth and invite route handlers.
- Integration test for failed-login 429; unit mapping for 429.
- No new tables. Multi-instance shared store is out of scope.
