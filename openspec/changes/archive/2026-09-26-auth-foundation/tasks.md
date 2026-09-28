# Tasks — auth schema foundation

- [x] Approve this proposal (solo in-repo process).
- [x] Add `users` and `sessions` to the Drizzle schema.
- [x] Generate/apply forward-only migration.
- [x] Require `DATABASE_URL` + `SESSION_SECRET` in Zod env.
- [x] Skeleton domain codes: `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, unique-violation → 409.
- [x] Do **not** add auth UI or `/api/v1/auth` handlers.
