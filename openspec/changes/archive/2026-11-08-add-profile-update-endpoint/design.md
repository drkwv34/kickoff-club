# Design

## Context

See proposal.md for motivation. `src/app/api/v1/me/route.ts` exports only GET. Registration already validates IANA timezones via `isValidIanaTimeZone` and `registerBodySchema`. Mutating routes call `assertCsrf` then `requireSession`. `UserRepository` has create/find but no update. Domain must not import `next/*`.

## Goals / Non-Goals

**Goals:**

- PATCH display name and timezone with CSRF and IANA validation.
- Settings form for signed-in users.
- Keep registration timezone behavior unchanged.

**Non-Goals:**

- Email or password changes on this endpoint.
- Notification preferences (separate change).

## Decisions

1. **Partial PATCH.** Zod object with optional `displayName` and `timezone`. At least one field required. Apply only present keys so a timezone-only body does not blank the name.

2. **Domain `updateProfile` + `users.update`.** Hash-free write of `display_name` / `timezone` and `updated_at`. Return `PublicUser`. Alternative: raw SQL in the route — rejected to keep domain/infra layering.

3. **Settings at `/app/settings`.** Client form mirrors register fields (label + datalist of common zones) and PATCHes `/api/v1/me`. Header gets a Settings link.

4. **Same CSRF as login/register.** Cookie `kickoff_csrf` + `X-CSRF-Token`. No new cookie.

## Risks / Trade-offs

- [Empty PATCH] → 400 `VALIDATION_ERROR` if both fields omitted.
- [Invalid IANA] → reuse `isValidIanaTimeZone`; do not accept offsets like `GMT+1`.

## Migration Plan

No schema change. Rollback is revert of the route and form.

## Open Questions

(none)
