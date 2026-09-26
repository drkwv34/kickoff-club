# Database migrations

## Tooling choice

**Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) — see [`docs/architecture/persistence.md`](../docs/architecture/persistence.md).

SQL artifacts live in [`drizzle/`](../drizzle/), not this folder. This README remains so Day 1 links keep working.

## Commands

```bash
pnpm db:migrate    # apply pending migrations (needs DATABASE_URL)
pnpm db:verify     # assert users/sessions/groups/group_memberships exist
pnpm db:generate   # after changing src/lib/db/schema.ts
```

Compose: `docker compose up --build` runs the `migrate` service before `app`.

CI: GitHub Actions applies migrations against a Postgres 16 service container, then `pnpm db:verify`.

## Forward-only

- Never edit a migration that has been applied on any shared environment.
- Fix mistakes with a **new** migration file.

## Naming

drizzle-kit timestamp prefix:

```
YYYYMMDDHHMMSS_short_snake_description.sql
```

## Order

Journaled in `drizzle/meta/_journal.json`. One logical change per file when possible.
