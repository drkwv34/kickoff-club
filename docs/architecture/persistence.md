# Persistence

## Choice: Drizzle ORM + SQL migrations

**Decision (Day 2):** use **Drizzle** (`drizzle-orm` + `drizzle-kit`) with PostgreSQL 16.

**Why not raw `pg` + hand-rolled SQL only:** the scaffold is TypeScript/Next already; Drizzle keeps schema in typed modules (`src/lib/db/schema.ts`) that domain/infra can import, while still emitting **forward-only SQL** under `drizzle/`. That is a better fit than a second ad-hoc runner, and more honest than a heavier ORM for a portfolio pin.

**Why not Prisma:** extra client generation step and a less SQL-shaped migration story than we want for waitlist/lock work later.

## Layout

| Path | Role |
|------|------|
| `src/lib/db/schema.ts` | Canonical table definitions |
| `src/lib/db/client.ts` | Lazy `postgres` + Drizzle singleton (Node runtime) |
| `src/lib/db/migrate.ts` | Apply journaled migrations |
| `src/lib/db/verify-schema.ts` | Assert core tables exist |
| `drizzle/` | Generated SQL + `meta/` journal — **do not edit applied files** |
| `drizzle.config.ts` | drizzle-kit config |

## Commands

From the repo root (Postgres reachable at `DATABASE_URL`):

```bash
cp .env.example .env          # if needed
pnpm db:generate              # after schema edits — commit the SQL
pnpm db:migrate               # apply pending migrations
pnpm db:verify                # information_schema check for core tables
```

Compose (starts Postgres, runs migrate to completion, then the app):

```bash
docker compose up --build
```

One-shot migrate against an already running `db` service:

```bash
docker compose run --rm migrate
```

## Forward-only

Never edit a migration that has been applied on any shared environment. Fix mistakes with a **new** migration. drizzle-kit timestamp prefixes (`YYYYMMDDHHMMSS_*.sql`) match the repo naming convention.

## Core tables (Day 2)

`users`, `sessions`, `groups`, `group_memberships`. Matches, RSVPs, invites, notifications are later OpenSpec changes.
