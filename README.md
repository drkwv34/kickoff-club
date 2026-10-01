# kickoff-club

Pickup-sports match organizer (RSVPs, waitlists, timezone-aware schedules, organizer tools). Product features land via OpenSpec-approved changes.

## Status

Day 4: **groups, invites, RBAC**. Create a group (you become organizer), invite by code/link, join as player. Demoting the last organizer returns 409 `LAST_ORGANIZER`. Matches/RSVP are still later OpenSpec changes.

## Stack

TypeScript · Next.js App Router · PostgreSQL 16 · **Drizzle ORM** · Docker Compose · Vitest · Playwright

**Package manager:** [pnpm](https://pnpm.io/) — lockfile committed; use `pnpm install`.

**ORM choice:** Drizzle (typed schema + forward-only SQL under `drizzle/`). Documented in [`docs/architecture/persistence.md`](docs/architecture/persistence.md).

## Quick start (local)

```bash
cp .env.example .env
docker compose config   # validate compose file
docker compose up --build
```

`docker compose up` starts Postgres, **applies migrations** (`migrate` service), then the app.

App: http://localhost:3000 · Mailpit UI: http://localhost:8025

### Groups

1. Sign in, open http://localhost:3000/app
2. Create a group (you are organizer).
3. Generate an invite link and open it as a second user (or paste the code).
4. The invitee joins as **player**. Demoting the last organizer via `PATCH /api/v1/groups/:id/members/:userId` returns 409 `LAST_ORGANIZER`.

1. Open http://localhost:3000/register
2. Create an account (password ≥ 12 characters, IANA timezone e.g. `America/Bogota`)
3. You land on `/app`. Sign out from the header.
4. Sign in again at `/login`.
5. After logout, `GET /api/v1/me` with the old `kickoff_session` cookie returns 401.

### Session policy

- Cookie `kickoff_session`: **HttpOnly**, **SameSite=Lax**, **Secure** in production, `Path=/`.
- Idle TTL **14 days** (slides on authenticated API use); absolute TTL **30 days** from session creation.
- Logout sets `sessions.revoked_at` (server-side revoke).
- Mutating `/api/v1` routes require CSRF: cookie `kickoff_csrf` + header `X-CSRF-Token` (double-submit). Missing/mismatch → 403.

### Migrate without Compose app

Postgres must be reachable at `DATABASE_URL` (Compose `db` service or local install):

```bash
pnpm db:migrate    # apply drizzle/ SQL
pnpm db:verify     # assert core tables exist
```

Against Compose Postgres only:

```bash
docker compose up -d db
docker compose run --rm migrate
```

## Hard edges (waitlist promotion)

When a `going` RSVP is cancelled or declined, promotion runs in the **same database transaction** as the spot opening: the match row is locked with `SELECT … FOR UPDATE`, the RSVP is updated, then the earliest waitlisted row (by `waitlist_position`, then `created_at`) is promoted until `going_count` reaches `capacity` or the waitlist is empty. Concurrent cancels on the same match serialize on the match lock so `going_count` cannot exceed capacity. See [`docs/architecture/transactionality.md`](docs/architecture/transactionality.md).

## Documentation

| Path | Purpose |
|------|---------|
| [`openspec/`](openspec/) | Capabilities and change proposals (OpenSpec gate) |
| [`docs/architecture/`](docs/architecture/) | Layering, errors, transactions, persistence, testing |
| [`.cursor/rules/`](.cursor/rules/) | Cursor agent rules derived from SRS §8 |

## Tests & CI

```bash
pnpm lint
pnpm typecheck
pnpm db:migrate  # required before integration tests
pnpm test        # Vitest unit + auth integration (needs Postgres)
```

GitHub Actions runs lint → typecheck → migrate → schema verify → test on pull requests and `main`.

## License

MIT — see [LICENSE](LICENSE).

---

_Full case-study README sections (problem → demo → hard edges) will be completed before pin-ready closeout per SRS §9._
