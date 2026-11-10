# Tasks

## 1. Regression coverage

- [x] 1.1 Add a Playwright test: organizer promotes a player, demotes them, edits a match, a player leaves, and the members list shows no-show counts. Confirm it fails before the UI controls exist.

## 2. Members list and edit match

- [x] 2.1 Add a client members list with role, no-show count, promote, demote, and leave; show `LAST_ORGANIZER` from a 409. Verify 1.1 reaches the role and leave assertions.
- [x] 2.2 Add `/app/matches/[matchId]/edit` with a labeled form that PATCHes `/api/v1/matches/:id`, link it from match detail for organizers of scheduled matches, and verify 1.1 passes.

## 3. Validation

- [x] 3.1 Run `openspec validate add-group-management-ui --strict` and confirm it exits 0.
