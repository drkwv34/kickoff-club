# Design

## Context

See proposal.md for motivation. `updateMatch` already patches capacity without a transaction. RSVP writes lock the match row via `findByIdForUpdate` and count `going` in the same transaction (`setRsvp`). `MatchesDeps.runInTransaction` currently rebuilds only `matches` + `series` stores, so a going count inside that callback would not share the lock connection. `DomainErrorCode.CAPACITY_BELOW_RSVPS` is already mapped to 409.

## Goals / Non-Goals

**Goals:**

- Serialize capacity edits with RSVP writes by locking the match row.
- Count `going` on the transactional connection before writing capacity.
- Reuse the existing domain error code; no new HTTP envelope.

**Non-Goals:**

- Auto-promoting waitlisted members when capacity increases.
- Changing waitlist rows when capacity shrinks to the going count.
- UI copy or form-level capacity hints.

## Decisions

1. **Transaction stores include RSVPs.** Extend `MatchStores` with `rsvps` and rebuild `createRsvpRepository(tx)` inside `runInTransaction`, mirroring `RsvpStores`. Alternative: a dedicated SQL helper on the match repo. Rejected because `countGoing` already exists on the RSVP port.

2. **Lock then count then update.** When `capacity` is present, `updateMatch` runs: `findByIdForUpdate` → `countGoing` → throw `CAPACITY_BELOW_RSVPS` if `capacity < goingCount` → `matches.update`. Other field patches stay in the same transaction so the write cannot race a new going RSVP.

3. **Equal-to-going is allowed.** Spec treats the floor as strict less-than, matching "below going count".

4. **Authz stays outside the lock.** `loadMatchForOrganizer` remains a pre-check (same pattern as `setRsvp`); the transactional lock re-reads the match row.

## Risks / Trade-offs

- [RSVP and match composition both create repos] → Keep constructors idempotent per connection; no shared mutable cache inside the TX callback.
- [Capacity-only vs mixed PATCH] → Always lock when capacity is in the input, even if other fields are present.

## Migration Plan

No schema change. Deploy is a code-only release; rollback is revert of the use-case.

## Open Questions

(none)
