# Design

## Context

See proposal.md for motivation. Auth and invite route handlers already throw `DomainError` through `handleApi`, which maps codes to status and `{ code, message, fields?, details? }`. Domain must not import `next/*`. Compose runs a single app process.

## Goals / Non-Goals

**Goals:**

- In-process limiter keyed by client identity and route family, applied at the HTTP layer.
- 429 `RATE_LIMITED` with `Retry-After` via the existing error mapper.
- Test-configurable max so other integration tests do not trip the limiter.

**Non-Goals:**

- Redis or Postgres-backed counters.
- Captcha, IP blocklists, or account lockout after N failures.
- Rate limits on GET/CSRF/read routes.

## Decisions

1. **In-memory sliding window per `(bucket, clientKey)`.** Default 5 attempts per 15 minutes. Alternative: DB table — rejected for v1; one Compose replica is enough. Client key is `X-Forwarded-For` first hop, else `X-Real-IP`, else `local`.

2. **HTTP helper, not domain.** `assertNotRateLimited(request, bucket)` in `src/lib/http/` throws `DomainError(RATE_LIMITED, …, { retryAfterSeconds })`. Domain stays free of `Request`. Alternative: middleware matcher — rejected so only the listed mutations are covered.

3. **`handleApi` sets `Retry-After`.** When the mapped code is `RATE_LIMITED`, copy `details.retryAfterSeconds` onto the header (seconds, integer ≥ 1). Public JSON keeps `code`, `message`, and `details.retryAfterSeconds`.

4. **Buckets.** `login`, `register`, `password-reset`, `password-reset-confirm`, `invite-create`, `invite-accept`. Login counts every POST (failed or not) so argon2 work is bounded.

5. **Test overrides.** `configureAuthRateLimitForTests` / `resetAuthRateLimitForTests`. Vitest default max is high enough that existing suites do not 429; the regression test sets max to 5 and asserts the 6th failed login.

## Risks / Trade-offs

- [Multi-instance counters diverge] → Document single-process scope; a shared store can replace the Map later.
- [NAT shares one IP] → 5/15m is generous for a pickup group; tests use a dedicated forwarded-for key.
- [Memory growth] → Drop expired buckets on consume.

## Migration Plan

No schema change. Rollback is revert of the helper, route calls, and error code.

## Open Questions

(none)
