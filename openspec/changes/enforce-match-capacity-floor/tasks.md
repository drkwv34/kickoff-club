# Tasks

## 1. Regression coverage

- [ ] 1.1 Add an integration test: match capacity 3 with 2 going RSVPs; PATCH capacity 1 returns 409 `CAPACITY_BELOW_RSVPS` and stored capacity stays 3; PATCH capacity 2 returns 200. Confirm the test fails before the domain change.

## 2. Domain lock and floor

- [ ] 2.1 Extend `MatchStores` / `runInTransaction` so the transactional callback can lock the match row and call `countGoing` on the same connection. Verify existing RSVP and match tests still typecheck.
- [ ] 2.2 In `updateMatch`, when capacity is present, `SELECT … FOR UPDATE` the match, count `going` RSVPs, throw `CAPACITY_BELOW_RSVPS` if the new capacity is below that count, otherwise write the patch in the same transaction. Verify the 1.1 test passes.

## 3. Validation

- [ ] 3.1 Run `openspec validate enforce-match-capacity-floor --strict` and confirm it exits 0.
