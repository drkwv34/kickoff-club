# Playwright e2e

Browser tests for the critical path (auth, groups, invites, matches, RSVP waitlist promotion, organizer no-show).

## Prerequisites

- Node 22 + pnpm
- Postgres with schema migrated (`pnpm db:migrate`)
- Env (same as the app): `DATABASE_URL`, `SESSION_SECRET` (32+ chars), `APP_BASE_URL` (default `http://localhost:3000`)

SMTP is optional; the app boots without Mailpit.

## Run locally

```bash
export DATABASE_URL=postgresql://kickoff:kickoff@localhost:5432/kickoff
export SESSION_SECRET=local-dev-session-secret-min-32-chars
pnpm db:migrate
pnpm test:e2e
```

`playwright.config.ts` builds and starts Next.js via `webServer` unless `CI=true` (CI runs `pnpm build` separately, then `pnpm start`).

## UI mode

```bash
pnpm test:e2e:ui
```

## CI

GitHub Actions runs lint → typecheck → migrate → Vitest → build → Playwright (Chromium, one worker, one retry).
