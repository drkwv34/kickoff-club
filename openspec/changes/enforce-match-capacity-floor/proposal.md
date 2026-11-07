# Proposal

## Why

Organizers can lower a match's capacity below the number of members already marked `going`. `CAPACITY_BELOW_RSVPS` is defined and mapped to HTTP 409 but `updateMatch` never counts going RSVPs, so over-subscribed edits succeed and leave the match inconsistent.

## What Changes

- `updateMatch` counts RSVPs with status `going` under a match-row `SELECT … FOR UPDATE` in the same transaction as the capacity write.
- If the requested capacity is below that going count, the use-case throws `CAPACITY_BELOW_RSVPS`; HTTP `PATCH /api/v1/matches/:id` returns 409 and stored capacity is unchanged.
- Capacity equal to the going count is allowed.
- Integration coverage: capacity 3 with 2 going, PATCH 1 → 409 and capacity stays 3; PATCH 2 → 200.

## Capabilities

### New Capabilities

<!-- none — extends matches -->

### Modified Capabilities

- `matches`: Organizer match edits MUST reject a new capacity below the current going RSVP count with `CAPACITY_BELOW_RSVPS`.

## Impact

- `src/modules/matches/domain/update-match.ts` and `src/modules/matches/composition.ts` (transaction stores include RSVP count + match lock).
- `PATCH /api/v1/matches/:id` error mapping (code already exists in `src/lib/errors/domain-error.ts`).
- Integration tests under `src/app/api/v1/matches/__tests__/`.
