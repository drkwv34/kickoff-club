# Capability: auth

**Status:** implemented (Day 3) — register / sign-in / sign-out with Postgres sessions.  
**SRS:** FR-AUTH-001..003 (Must). FR-AUTH-004 (Should, not started).  
**OpenSpec:** [`changes/2026-09-26-auth-sessions`](../changes/2026-09-26-auth-sessions/) (product). Schema: [`changes/2026-09-26-auth-foundation`](../changes/2026-09-26-auth-foundation/).

## What this capability does

Session-based identity:

- `POST /api/v1/auth/register` — email, password (≥12), display name, IANA timezone; Argon2id hash; session cookie.
- `POST /api/v1/auth/login` / `POST /api/v1/auth/logout` — logout sets `sessions.revoked_at`.
- `GET /api/v1/auth/csrf` — double-submit CSRF cookie + token.
- `GET /api/v1/me` — current user; rejected if session missing, expired, or revoked.
- UI: `/register`, `/login`, `/app`.

Email uniqueness is case-insensitive (`citext`). Invalid login uses one message for unknown email and bad password.

## Session policy

- Cookie `kickoff_session`: HttpOnly, SameSite=Lax, Secure in production, Path=/.
- Idle TTL 14 days (sliding on authenticated API use); absolute 30 days from creation.
- Raw token is random; only SHA-256 is stored.
- CSRF: cookie `kickoff_csrf` + header `X-CSRF-Token` required on mutating `/api/v1` routes.

## Explicitly not this capability

OAuth, password reset, groups UI.
