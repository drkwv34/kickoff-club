# Tasks

## 1. Regression coverage

- [ ] 1.1 Add an integration test: organizer marks a going player (count 1), DELETE returns 204 and count 0; the same player DELETE returns 403. Confirm it fails before the unmark route exists.

## 2. Unmark API and UI

- [ ] 2.1 Add domain `unmarkNoShow`, delete the `no_shows` row, recompute `no_show_count`, and export DELETE `/api/v1/matches/:id/no-shows/:userId` with CSRF. Verify 1.1 passes.
- [ ] 2.2 Add an unmark button on match detail for marked players and verify organizers can trigger DELETE from the UI.

## 3. Validation

- [ ] 3.1 Run `openspec validate add-no-show-unmark --strict` and confirm it exits 0.
