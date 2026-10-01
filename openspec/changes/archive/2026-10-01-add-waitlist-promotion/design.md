# Design — add-waitlist-promotion

## Transaction boundary

Extend Day 7 RSVP mutation transaction:

1. Lock match (`SELECT … FOR UPDATE`).
2. Apply user’s transition (cancel / decline / going).
3. If a `going` seat was freed, call `fillOpenSpotsFromWaitlist` until `going_count == capacity` or waitlist empty.
4. After any waitlisted row leaves the waitlist (promotion or cancel), `compactWaitlist` to keep positions 1..n.

Promotion runs in the **same** transaction as the cancel/decline that freed the seat.

## Concurrency

- Match row lock serializes competing cancels/promotions for one match.
- `fillOpenSpotsFromWaitlist` selects the next waitlisted row ordered by `(waitlist_position ASC, created_at ASC)` and updates it to `going` with `waitlist_position = null`.
- Re-count `going` inside the loop; never promote if `going_count >= capacity` (defensive invariant).

Parallel integration test: capacity 2, two going + two waitlisted; two concurrent DELETE on going users → both waitlisted promote, final `going_count == 2`.

## Domain errors

Internal invariant violations (promote when full) map to `DomainErrorCode.CONFLICT` with stable message constant — not expected on happy path when match lock is held.

## Out of scope

Notifications, no-show, Playwright e2e.

## Testing

- Update cancel test to expect promotion.
- New parallel race test with `Promise.all` on two cancel requests.
