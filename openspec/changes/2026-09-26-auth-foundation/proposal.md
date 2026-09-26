# Change: auth schema foundation

| Field | Value |
|-------|--------|
| **ID** | `2026-09-26-auth-foundation` |
| **Status** | **approved** |
| **Approved at** | 2026-09-26 |
| **Approver** | Christian Agila (`drkwv34`) — in-repo solo review |
| **SRS** | FR-AUTH-001..003 (schema + config only); NFR-MAINT-002 |
| **Capability** | `auth` |

## Intent

Land the **persistence and boot-config foundation** for session-based identity so Day 3 can implement register / sign-in / sign-out without inventing tables.

Postgres-backed sessions (SRS §2.1, §6.1). No JWT. No auth UI in this change.

## Scope (in)

- `users` table: uuid PK, `citext` unique email, `password_hash`, `display_name`, IANA `timezone`, timestamps.
- `sessions` table: uuid PK, `user_id` FK, unique `token_hash`, `expires_at`, `created_at`, nullable `revoked_at`.
- Indexes needed for lookup by token hash and by user.
- Fail-fast Zod env: `DATABASE_URL` and `SESSION_SECRET` (≥32 chars) required at process boot.
- Domain error codes used by auth (`INVALID_CREDENTIALS`, `EMAIL_TAKEN`, unique-violation mapping) as a **skeleton** — no HTTP auth routes yet.

## Out of scope

- Register / login / logout API or UI (Day 3).
- Password hashing implementation (Day 3).
- CSRF cookie wiring (Day 3).
- Password reset (FR-AUTH-004, Should).
- OAuth.

## Acceptance

- [x] Forward-only Drizzle migration applies on a fresh Postgres 16 database.
- [x] `users` and `sessions` exist with the columns above; email uniqueness is case-insensitive (`citext`).
- [x] `pnpm db:migrate` is documented; Compose and CI can run it.
- [x] Invalid env fails boot; no secrets committed.
- [x] No login/register pages or `/api/v1/auth/*` product handlers.

## Traceability

| Requirement | This change |
|-------------|-------------|
| FR-AUTH-001 email uniqueness / hash column | Schema only (`email citext unique`, `password_hash`) |
| FR-AUTH-002 session revoke | `sessions.revoked_at` column |
| FR-AUTH-003 cookie TTL policy | Columns `expires_at`; policy documented later in README |
| NFR-MAINT-002 forward-only migrations | Drizzle journal + no edit of applied files |
