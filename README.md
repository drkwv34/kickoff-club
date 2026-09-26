# kickoff-club

**Architecture-first scaffold.** Pickup-sports match organizer (RSVPs, waitlists, timezone-aware schedules, organizer tools) — product features land via OpenSpec-approved changes after Day 1.

## Status

This repo is in **scaffold phase**: layers, folder conventions, Docker Compose, CI, and agent docs are in place. No auth, matches, or RSVP implementation yet.

## Stack (planned)

TypeScript · Next.js App Router · PostgreSQL 16 · Docker Compose · Vitest · Playwright

**Package manager:** [pnpm](https://pnpm.io/) — lockfile committed; use `pnpm install`.

## Quick start (local)

```bash
cp .env.example .env
docker compose config   # validate compose file
docker compose up --build
```

App: http://localhost:3000 · Mailpit UI: http://localhost:8025

## Documentation

| Path | Purpose |
|------|---------|
| [`openspec/`](openspec/) | Capabilities and change proposals (OpenSpec gate) |
| [`docs/architecture/`](docs/architecture/) | Layering, errors, transactions, testing, integrations, UI conventions |
| [`.cursor/rules/`](.cursor/rules/) | Cursor agent rules derived from SRS §8 |

## Tests & CI

```bash
pnpm lint
pnpm typecheck
pnpm test        # Vitest (stub smoke)
```

GitHub Actions runs lint → typecheck → test on pull requests and `main`.

## License

MIT — see [LICENSE](LICENSE).

---

_Full case-study README sections (problem → demo → hard edges) will be completed before pin-ready closeout per SRS §9._
