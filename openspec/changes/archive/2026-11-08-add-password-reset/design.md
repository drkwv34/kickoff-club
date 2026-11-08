# Design

## Context

See proposal.md for motivation. Auth today is register/login/logout with Argon2id passwords and SHA-256 session tokens. CSRF is required on mutating `/api/v1` routes. Email goes through `NotificationMailer` (SMTP / Mailpit) with `setNotificationsMailerForTests`. Domain must not import `next/*`. FR-AUTH-004 is listed in `openspec/backlog/should-scope.md`.

## Goals / Non-Goals

**Goals:**

- Hashed one-use token, 1 hour TTL, existence-hiding request, confirm that revokes sessions and signs in.
- Public pages and a login link.

**Non-Goals:**

- Rate limiting (later change).
- Changing email without reset.
- Multi-factor recovery.

## Decisions

1. **Table `password_reset_tokens`.** Columns: uuid PK, `user_id` FK cascade, unique `token_hash`, `expires_at`, nullable `used_at`, `created_at`. Store SHA-256 of the raw token (same as sessions). TTL 60 minutes from `clock()`.

2. **Endpoints.** `POST /api/v1/auth/password-reset` `{ email }` → 200 `{ ok: true }` always. `POST /api/v1/auth/password-reset/confirm` `{ token, password }` → 200 `{ user }` + session cookies. Both CSRF-protected. Alternative: a single path with a `token` discriminator — rejected for clearer routing.

3. **Issue and consume in domain.** `requestPasswordReset` looks up by email; if missing, dummy-hash delay analogue is optional but do not send mail. If present, insert token, send `password_reset` mail template with `resetUrl` (`APP_BASE_URL/reset-password?token=`). `confirmPasswordReset` hashes the presented token, 410 `GONE` if missing/used/expired, else Argon2id hash, `used_at`, `revokeAllForUser`, `issueSession`.

4. **Outstanding tokens.** Mark prior unused tokens for the user as used when issuing a new one so only the latest link works.

5. **Mailer template.** Extend `NotificationMailTemplate` with `password_reset` without adding an in-app notification type.

6. **Pages.** `/forgot-password` posts email; `/reset-password` reads `token` from the query string. Login form-switch includes the forgot link.

## Risks / Trade-offs

- [Timing oracle] → Same JSON body; still a small timing difference on send. Acceptable for v1; dummy work is optional.
- [Token in query string] → Standard for email links; token is single-use and short-lived.
- [Session revoke vs new login] → Revoke all including none of the current request (unauthenticated confirm), then set a fresh cookie.

## Migration Plan

Forward-only SQL `create_password_reset_tokens`. Add the table to `CORE_TABLES` and `TRUNCATE` in test helpers. Rollback is a new migration only if needed.

## Open Questions

(none)
