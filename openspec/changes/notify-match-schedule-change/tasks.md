# Tasks

## 1. Regression coverage

- [ ] 1.1 Add an integration test: PATCH `startsAt` on a match with one going and one waitlisted member expects one `match_updated` in-app row and one recording-mailer send per those members; a following description-only PATCH adds none. Confirm it fails before event wiring.

## 2. Notification type and publish

- [ ] 2.1 Add `match_updated` to the Postgres enum (forward-only SQL + Drizzle `pgEnum`), domain types, mail templates, and SMTP subject/body. Verify `pnpm db:migrate` applies and typecheck passes.
- [ ] 2.2 Detect start/end/venue changes in `updateMatch`, notify going and waitlisted members from the PATCH route after a successful write, and verify 1.1 passes.

## 3. Validation

- [ ] 3.1 Run `openspec validate notify-match-schedule-change --strict` and confirm it exits 0.
