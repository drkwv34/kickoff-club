# Tasks — auth schema foundation

- [ ] Approve this proposal (solo in-repo process).
- [ ] Add `users` and `sessions` to the Drizzle schema.
- [ ] Generate/apply forward-only migration.
- [ ] Require `DATABASE_URL` + `SESSION_SECRET` in Zod env.
- [ ] Skeleton domain codes: `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, unique-violation → 409.
- [ ] Do **not** add auth UI or `/api/v1/auth` handlers.
