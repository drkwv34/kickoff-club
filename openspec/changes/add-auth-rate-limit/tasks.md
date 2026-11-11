# Tasks

## 1. Regression coverage

- [x] 1.1 Add an integration test: N+1 failed logins from the same client return 429 `RATE_LIMITED` with `Retry-After` and the standard error body. Confirm it fails before the limiter exists.

## 2. Limiter and routes

- [x] 2.1 Add `RATE_LIMITED` (HTTP 429), an in-memory per-client limiter, `Retry-After` on `handleApi`, and apply it to login, register, password-reset, password-reset confirm, invite create, and invite accept. Verify 1.1 passes and existing auth tests still pass.

## 3. Validation

- [x] 3.1 Run `openspec validate add-auth-rate-limit --strict` and confirm it exits 0.
