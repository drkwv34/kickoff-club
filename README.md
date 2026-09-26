# kickoff-club

**Architecture-first scaffold.** Pickup-sports match organizer (RSVPs, waitlists, timezone-aware schedules, organizer tools) — product features land via OpenSpec-approved changes after Day 1.

## Status

Day 2: **schema foundation**. Drizzle migrations create `users`, `sessions`, `groups`, and `group_memberships`. There is still **no auth UI** and no register/login API.

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
pnpm test        # Vitest
pnpm db:migrate  # CI also runs this against a Postgres service
```

GitHub Actions runs lint → typecheck → test → migrate → schema verify on pull requests and `main`.

## License

MIT — see [LICENSE](LICENSE).

---

_Full case-study README sections (problem → demo → hard edges) will be completed before pin-ready closeout per SRS §9._
