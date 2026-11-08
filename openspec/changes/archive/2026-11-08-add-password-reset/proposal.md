# Proposal

## Why

FR-AUTH-004 (password reset via email token) is still backlog-only. Users who forget a password have no recovery path: there is no token table, no reset email, and no forgot/reset pages.

## What Changes

- Implement the full reset flow: one-use token stored as a hash with a ~1 hour TTL, request email that does not reveal whether the address exists, API endpoints including `POST /api/v1/auth/password-reset`, pages at `/forgot-password` and `/reset-password`, and a "forgot password" link on `/login`.
- A successful reset sets the new password, invalidates existing sessions, and signs the user in.
- Reused or expired tokens return 410 or 400.
- Regression: request reset → one email with a token for a known user; same response shape for an unknown email and no mail; successful reset logs the user in with the new password; reused or expired token → 410 or 400.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `auth`: Password reset MUST issue a hashed one-use token, email it without revealing account existence, complete the reset, and revoke other sessions.
- `app-ui`: `/login` MUST link to forgot-password; `/forgot-password` and `/reset-password` MUST complete the flow.

## Impact

- New `password_reset_tokens` table (forward-only SQL + Drizzle).
- `src/modules/auth/**`, mailer template, `/api/v1/auth/password-reset` and confirm route.
- Public pages and login link.
- Remove FR-AUTH-004 from the Should-scope backlog once the capability is specified.
