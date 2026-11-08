# Tasks

## 1. Regression coverage

- [x] 1.1 Add an integration test: password-reset request for a known email returns 200 and one mailer message containing a token; the same response shape for an unknown email with no mail; confirm with that token signs the user in on the new password and rejects the prior session; reused or expired token returns 410 or 400. Confirm it fails before the routes exist.

## 2. Persistence and domain

- [x] 2.1 Add `password_reset_tokens` (SQL migration + Drizzle), repository methods, `requestPasswordReset` / `confirmPasswordReset`, session `revokeAllForUser`, and user password update. Verify unit tests cover known/unknown email and used/expired tokens.
- [x] 2.2 Wire `POST /api/v1/auth/password-reset` and `POST /api/v1/auth/password-reset/confirm` with CSRF, extend the mailer with a `password_reset` template, add `/forgot-password`, `/reset-password`, and a forgot-password link on `/login`. Verify 1.1 passes.

## 3. Validation

- [x] 3.1 Run `openspec validate add-password-reset --strict` and confirm it exits 0. Drop FR-AUTH-004 from `openspec/backlog/should-scope.md`.
