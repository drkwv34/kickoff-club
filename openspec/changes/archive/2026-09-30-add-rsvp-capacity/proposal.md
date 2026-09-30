# Proposal

## Why

Players need to signal attendance on scheduled matches with hard capacity limits (FR-RSVP-001). Day 7 delivers RSVP going/declined/cancelled, transactional capacity enforcement, and waitlist enqueue when full — without auto-promotion (Day 8).

## What Changes

- Add `rsvps` table: unique `(match_id, user_id)`, status enum, optional `waitlist_position`.
- Domain use-cases: upsert RSVP (`going` | `declined`), cancel own RSVP; member-only authz (FR-RSVP-005).
- Transactional capacity: `SELECT … FOR UPDATE` on match row; count `going`; assign `going` or `waitlisted` with monotonic position.
- APIs: `POST /api/v1/matches/:id/rsvps`, `DELETE /api/v1/matches/:id/rsvps/me`; match GET includes viewer RSVP + going count summary.
- UI: RSVP controls on match detail.
- Integration tests: fill capacity, waitlist when full, unique RSVP, non-member forbidden.

## Out of scope (Day 8+)

- Waitlist auto-promotion on cancel or race tests (FR-RSVP-003).
- Organizer force-remove another user’s RSVP.
- Notifications, no-shows, capacity shrink vs existing going count on match edit.

## Capabilities

### New Capabilities

- `rsvps`: persistence, capacity path, member RSVP API, match detail UI.

### Modified Capabilities

- `matches`: GET match detail may include RSVP summary fields for the viewer.

## Impact

- `src/modules/rsvps/` domain, infra, composition, validation.
- Drizzle migration + schema; `CORE_TABLES` / test truncate updated.
- REST routes under `/api/v1/matches/:id/rsvps`.
- Vitest integration suite for capacity and authz.

## Traceability

| Requirement | This change |
|-------------|-------------|
| FR-RSVP-001 | Going vs waitlisted when full; idempotent re-POST |
| FR-RSVP-002 | Decline/cancel transitions (no promotion) |
| FR-RSVP-005 | Members only |
