# Proposal

## Why

Reviewers and hiring loops need a self-contained story: what kickoff-club does, how to run it, and a repeatable demo dataset without manual signup. Day 12 delivers SRS §9 README case-study structure plus an idempotent database seed wired into docs and CI.

## What Changes

- Rewrite root `README.md` with the nine mandated sections (what/why → trade-offs), accurate to the current codebase.
- Add `pnpm db:seed` (and Compose one-liner) that upserts demo organizer, player, group, and an upcoming match with documented credentials.
- Complete `.env.example` (including optional `LOG_LEVEL` the app reads).
- Vitest coverage proving the seed runs twice without duplicates; CI runs seed twice after migrate.
- Optional GitHub About blurb/topics via API (fallback documented in README if forbidden).

## Capabilities

### New Capabilities

- `demo-seed`: Idempotent demo dataset for local/Compose review (users, group, upcoming match, documented credentials).

### Modified Capabilities

- _(none — seed is additive tooling; product API behavior unchanged)_

## Impact

- `README.md`, `.env.example`, `package.json`, `src/lib/db/seed*.ts`, `src/lib/db/__tests__/seed-demo.test.ts`, `.github/workflows/ci.yml`
- `openspec/specs/demo-seed/spec.md` (after archive sync)

## Non-goals

- Hosted deploy, profile README repo, new product features, Day 13 triage polish.
