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

Current pipeline:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` (Vitest)
4. `pnpm db:migrate` against a Postgres 16 service container
5. `pnpm db:verify` (core tables present)

Future gates (SRS §7): broader integration tests, `next build`, Playwright with Compose.

## What to test hard

Authz matrix, waitlist concurrency, timezone DST fixtures, CSRF/session, idempotent RSVP.

## What not to over-test

CSS pixels, every empty-state variant, load tests in CI (manual k6 optional).

## Playwright

Config stub only on Day 1 — no feature specs until UI flows exist.
