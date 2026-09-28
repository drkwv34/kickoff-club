# Capability: matches

**Status:** implemented (Day 5) — one-off matches + timezone display.  
**SRS:** FR-MATCH-001, FR-MATCH-003, FR-MATCH-004, FR-MATCH-005.  
**OpenSpec:** [`changes/2026-09-29-matches-one-off`](../changes/2026-09-29-matches-one-off/).

## What this capability does

Timezone-aware pickup sessions within a group:

- `POST /api/v1/groups/:id/matches` — organizer; default TZ = group home TZ.
- `GET /api/v1/groups/:id/matches` — member list (by `start_at`).
- `GET /api/v1/matches/:id` — member detail.
- `PATCH /api/v1/matches/:id` — organizer; before `start_at`, `scheduled` only.
- `POST /api/v1/matches/:id/cancel` — organizer; `status = cancelled`.

`start_at` / `end_at` are `timestamptz`; `timezone` is IANA for wall-clock display.

UI: `/app/groups/:groupId/matches/new`, `/app/matches/:matchId`.

Domain time helpers: `src/modules/matches/domain/time-display.ts`.

## Explicitly not this capability (yet)

Recurring series, RSVP/waitlist, cancel email/notifications, list filters/pagination.
