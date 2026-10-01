# Transactionality

## Boundaries

- **One use-case = one transactional unit** when mutating multiple rows (e.g. cancel RSVP + promote waitlist + enqueue notification).
- Repositories accept a `tx` handle (or unit-of-work interface) from infra; domain use-cases orchestrate calls within a single transaction started in infra or a thin application service.

## Isolation

- Default Postgres **`READ COMMITTED`**; promotion and capacity paths use **`SELECT … FOR UPDATE`** on the match row (serializes competing cancels for one match). The earliest waitlisted RSVP row is selected with `ORDER BY waitlist_position, created_at` and updated to `going` inside the same transaction as the cancel/decline that freed the seat.
- Avoid long-held transactions across HTTP client calls or SMTP.

## Idempotent writes

- APIs that retry (client or worker) use **idempotency keys** or natural keys where FR requires (e.g. unique `(match_id, user_id)` for RSVP).
- Email/outbox: status transitions guard double-send (`pending` → `sent` once).

## Migrations

Schema changes are **forward-only**; data backfills in separate migration files with batching notes if large.

## Testing

Integration tests assert invariants after concurrent operations (waitlist promotion race tests on Day 8+).
