# Testing strategy

## Pyramid

| Layer | Tool | Scope |
|-------|------|--------|
| Unit | Vitest | Pure domain: timezone helpers, authz, recurrence, waitlist ordering |
| Integration | Vitest + Postgres (Compose / CI service) | Migrations, RSVP capacity, promotion races, authz matrix |
| E2E | Playwright | Critical user journeys (Day 11+) |

## Layout

Tests **colocated** as `*.test.ts` next to source **or** under `__tests__/` within the same module — pick one style per folder; this repo uses `__tests__/` under `src/lib/` and will colocate in modules as features land.

## CI (GitHub Actions)

The `quality` job in `.github/workflows/ci.yml` currently:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm db:migrate` against a Postgres 16 service container
4. `pnpm db:verify` (core tables present)
5. `pnpm db:seed` twice (idempotent demo dataset)
6. `pnpm test` (Vitest unit + integration against the same Postgres)
7. `pnpm build`
8. `pnpm test:e2e` (Playwright Chromium; `webServer` runs `pnpm start` in CI)
9. `pnpm openspec:validate`

## What to test hard

Authz matrix (groups roles + last organizer), waitlist concurrency, timezone DST fixtures, CSRF/session, idempotent RSVP.

## What not to over-test

CSS pixels, every empty-state variant, load tests in CI (manual k6 optional).

## Playwright

Specs live in `e2e/` (see `e2e/README.md`). Critical-path coverage: register, group + invite, match RSVP, waitlist promotion, organizer no-show. Prefer role/label selectors; CI uses one worker and at most one retry per test.
