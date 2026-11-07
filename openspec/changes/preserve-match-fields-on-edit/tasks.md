# Tasks

## 1. Regression coverage

- [ ] 1.1 Add a schema unit test: parsing `{ venue }` leaves `description` undefined; parsing `{ description: "" }` and `{ description: null }` yield `null`. Confirm it fails on the current transform.
- [ ] 1.2 Add an integration test: PATCH only `venue` keeps `description`; PATCH `description: ""` clears it. Confirm it fails before the schema change.

## 2. Schema fix

- [ ] 2.1 Change `updateMatchBodySchema` so omitted `description` stays undefined while `""`/`null` become null, without altering create-match behavior. Verify 1.1 and 1.2 pass.

## 3. Validation

- [ ] 3.1 Run `openspec validate preserve-match-fields-on-edit --strict` and confirm it exits 0.
