# Proposal

## Why

Day 7 enqueues waitlisted players when a match is full but does not fill freed spots when someone cancels. Players expect FIFO promotion when capacity opens, and concurrent cancels must never push `going_count` above `capacity` (FR-RSVP-003).

## What Changes

- Auto-promote the earliest eligible waitlisted RSVP when a `going` spot opens (cancel or decline from `going`).
- Same transactional boundary as Day 7: lock match row, mutate RSVP, promote in FIFO order, compact waitlist positions.
- Integration test: parallel cancels with two waitlisted players → two promotions, capacity invariant holds.
- Brief architecture note on the promotion race strategy.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `rsvps`: Replace “cancel without promotion” with auto-promotion on spot open; add concurrency requirement.

## Impact

- `src/modules/rsvps/domain` (`cancel-rsvp`, `set-rsvp`, new promotion helper)
- `src/modules/rsvps/infra/rsvp-repos.ts` (waitlist head lookup / lock)
- Integration tests under `src/app/api/v1/matches/__tests__/`
- `docs/architecture/` or README hard-edges fragment
- `openspec/specs/rsvps/spec.md` (via delta)
