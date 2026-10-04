# Proposal

## Why

The product has a demonstrable UI happy path (Day 10) and solid Vitest coverage, but there is no browser-level regression gate or CI proof that waitlist promotion and organizer flows work end-to-end. Day 11 adds Playwright critical-path tests and extends GitHub Actions so the pipeline is badge-ready.

## What Changes

- Playwright spec(s) under `e2e/` covering register → group → match → RSVP → waitlist → promotion → no-show (as feasible in the browser).
- `playwright.config.ts` webServer to boot Next.js against migrated Postgres; unique test identities per run.
- `package.json` scripts (`test:e2e`, optional `test:e2e:ui`).
- CI job order: lint → typecheck → migrate/verify → unit/integration → `next build` → Playwright (Postgres service; Playwright browser install).
- Brief `e2e/README.md` for local runs.

## Capabilities

### New Capabilities

- `e2e`: Automated browser critical-path coverage and CI execution requirements.

### Modified Capabilities

- _(none — e2e validates existing behavior; no API/domain requirement changes)_

## Impact

- `e2e/`, `playwright.config.ts`, `package.json`, `.github/workflows/ci.yml`
- `docs/architecture/testing-strategy.md` (CI section alignment)
- No migrations or domain modules

## Non-goals

- Visual regression, load tests, coverage thresholds, Day 12 README/seed polish.
