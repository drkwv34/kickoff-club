# Design — add-rsvp-capacity

## Transaction boundary

One RSVP mutation = one DB transaction:

1. Verify actor is group member (read membership).
2. `SELECT id FROM matches WHERE id = ? FOR UPDATE` (lock match row).
3. Reject if match cancelled or already started (same rules as match edit).
4. Load existing RSVP for `(match_id, user_id)` if any.
5. Apply transition:
   - **going**: if already `going` → return unchanged (idempotent). Else count `status = 'going'`; if `count < capacity` → `going`, clear position; else `waitlisted` with `max(position)+1` (or 1).
   - **declined**: set `declined`, clear position.
   - **cancel** (DELETE): set `cancelled`, clear position; if was `waitlisted`, renumber remaining waitlist positions to stay contiguous (1..n).
6. Commit.

**No promotion** when a `going` RSVP is cancelled — freed capacity is not assigned until Day 8.

## Waitlist ordering

FIFO via integer `waitlist_position` assigned at enqueue time. Compaction only when a waitlisted row is removed/cancelled.

## API shapes

- `POST …/rsvps` body `{ "status": "going" | "declined" }` → `{ "rsvp": { … } }`.
- `DELETE …/rsvps/me` → `{ "rsvp": { … } }` with status `cancelled`.
- `GET …/matches/:id` adds `goingCount`, optional `viewerRsvp`.

## Layering

`src/app/api` → `src/modules/rsvps/domain` → `src/modules/rsvps/infra`. Reuse `loadMatchForMember` from matches access via injected ports (membership + match lookup).

## Testing

Integration: sequential registrations fill capacity; next user `waitlisted`; cancel one `going` does not promote; outsider 403.
