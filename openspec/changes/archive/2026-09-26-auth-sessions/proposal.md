# Change: auth sessions (register / sign-in / sign-out)

| Field | Value |
|-------|--------|
| **ID** | `2026-09-26-auth-sessions` |
| **Status** | **implemented** |
| **Approved at** | 2026-09-26 |
| **Approver** | Christian Agila (`drkwv34`) — in-repo solo review |
| **SRS** | FR-AUTH-001, FR-AUTH-002, FR-AUTH-003; NFR-SEC-001, NFR-SEC-003 |
| **Capability** | `auth` |
| **Depends on** | `2026-09-26-auth-foundation` (schema + env) |

## Intent

Ship session-based register, sign-in, and sign-out on top of the Day 2 `users` / `sessions` tables. No OAuth. No password reset.

## Scope (in)

- Argon2id password hashing; case-insensitive unique email (`citext`).
- HttpOnly session cookies (`SameSite=Lax`, `Secure` in production).
- Double-submit CSRF on mutating `/api/v1` routes.
- Server-side session revoke on logout (`sessions.revoked_at`).
- API: `POST /api/v1/auth/register|login|logout`, `GET /api/v1/auth/csrf`, `GET /api/v1/me`.
- Minimal UI: `/register`, `/login`, authenticated `/app`, sign-out control.
- Tests: duplicate email, uniform invalid-credentials message, cookie flags, CSRF 403, revoked session rejected.

## Out of scope

- OAuth / social login.
- Password reset (FR-AUTH-004 Should).
- Groups UI, invites, RSVP, matches.

## Session policy (normative)

- Cookie name: `kickoff_session` (HttpOnly). CSRF cookie: `kickoff_csrf` (readable; paired with `X-CSRF-Token`).
- Idle TTL: **14 days** from last authenticated API use (sliding `expires_at`, cookie refreshed on auth API responses).
- Absolute TTL: **30 days** from `sessions.created_at` (never extended past this).
- Raw token is random; only SHA-256 hex is stored (`token_hash`).

## Acceptance

- [x] Register creates a user + session; duplicate email (any case) → 409 `EMAIL_TAKEN`.
- [x] Login unknown email and wrong password return the same 401 message.
- [x] Logout sets `revoked_at`; subsequent `/api/v1/me` and `/app` reject the cookie.
- [x] Session `Set-Cookie` includes HttpOnly and SameSite=Lax; Secure when `NODE_ENV=production`.
- [x] Mutating `/api/v1` request without a matching CSRF token → 403.

## Traceability

| Requirement | This change |
|-------------|-------------|
| FR-AUTH-001 | Register API + hashing + citext uniqueness |
| FR-AUTH-002 | Login / logout + revoke |
| FR-AUTH-003 | Cookie flags + CSRF |
| NFR-SEC-001 | Argon2id unit test (`$argon2id$`) |
| NFR-SEC-003 | Cookie flag assertions |
