# Tasks — add-waitlist-promotion

## 1. Domain & infra

- [x] Add `fillOpenSpotsFromWaitlist` (match lock assumed) and repo helper for earliest waitlisted row
- [x] Wire promotion into `cancelMyRsvp` and `setRsvp` when a `going` seat opens
- [x] Stable domain message for promotion invariant violation (if needed)

## 2. Tests

- [x] Update integration test: cancel promotes waitlist
- [x] Add parallel cancel race integration test (capacity invariant)

## 3. Docs

- [x] Document promotion race strategy (architecture or README hard-edges)

## 4. Validation

- [x] `openspec validate add-waitlist-promotion --strict`
- [x] `pnpm test` (integration)
