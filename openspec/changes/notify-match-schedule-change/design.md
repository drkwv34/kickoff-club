# Design

## Context

See proposal.md for motivation. Cancel already notifies `going` + `waitlisted` from the HTTP route after the domain write (`notifyMatchCancelled`), using `listUserIdsByMatchWithStatuses`. Email is attempted after the in-app insert and must not roll back that row. `notification_type` is a Postgres enum; adding a value needs a forward-only `ALTER TYPE … ADD VALUE`. Domain modules must not import `next/*`.

## Goals / Non-Goals

**Goals:**

- Detect actual start/end/venue changes inside `updateMatch` so the route can notify without a second match load.
- Reuse cancel’s recipient query and `publishNotification`.
- Keep SMTP out of the match update transaction.

**Non-Goals:**

- Notifying declined/cancelled RSVPs or the organizer unless they are going/waitlisted.
- Preference toggles.
- Push/SMS.

## Decisions

1. **Change detection in the use-case.** Compare input to the pre-update match (`getTime()` for instants, string equality for venue). Same-value PATCH does not notify. Return `{ match, scheduleOrVenueChanged }` from `updateMatch`; the route serializes only `{ match }`.

2. **Notify in the PATCH route after commit.** Same pattern as cancel: list recipients, then `notifyMatchUpdated` per user. Avoids SMTP inside the capacity-lock transaction.

3. **Enum append.** New SQL migration `ALTER TYPE "public"."notification_type" ADD VALUE 'match_updated'` plus Drizzle `pgEnum` update. No table rewrite.

4. **Test mailer seam.** `setNotificationsMailerForTests` replaces the SMTP adapter so integration tests can assert template and recipient without Mailpit.

## Risks / Trade-offs

- [ADD VALUE in a migration transaction] → Postgres 16 allows it; do not use the new value in the same migration file.
- [RSVP confirmed emails already recorded] → Tests filter on `match_updated` rather than total send count.
- [Capacity-lock TX vs notify] → Notify after commit so a 409 capacity rejection emits nothing.

## Migration Plan

Apply the enum migration with existing `pnpm db:migrate`. Rollback is a new migration only if needed; do not edit the applied file.

## Open Questions

(none)
