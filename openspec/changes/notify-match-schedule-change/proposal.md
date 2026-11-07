# Proposal

## Why

Going and waitlisted members are not told when an organizer moves a match or changes the venue. There is no `match_updated` notification type, and `updateMatch` does not publish an event, so players keep stale times until they reopen the match.

## What Changes

- Add notification type `match_updated` (enum migration).
- When `PATCH /api/v1/matches/:id` changes start, end, or venue, create an in-app notification and attempt email for each member with RSVP status `going` or `waitlisted`.
- A PATCH that only changes description (or other non-schedule fields) emits no `match_updated` events.
- Regression: PATCH `startsAt` → one `match_updated` per going/waitlisted member plus a test mailer message; description-only PATCH → none.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `matches`: Organizer edits that change start, end, or venue MUST notify going and waitlisted members.
- `notifications`: Supported event types MUST include `match_updated`, delivered in-app and via the mailer adapter.

## Impact

- Forward-only SQL migration adding `match_updated` to `notification_type`.
- `src/lib/db/schema.ts`, `src/modules/notifications/**` (types, publish templates, SMTP copy, match-events).
- `PATCH /api/v1/matches/:id` after a successful domain update.
- Integration test with a recording mailer; no production ESP change.
