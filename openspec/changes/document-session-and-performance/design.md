# Design

## Context

See proposal.md for motivation. `SESSION_IDLE_TTL_MS` is 14 days and `SESSION_ABSOLUTE_TTL_MS` is 30 days in `src/modules/auth/domain/session.ts`. Architecture docs already describe this; README "Hard edges" only mentions HttpOnly + CSRF. There is no `scripts/perf/` directory.

## Goals / Non-Goals

**Goals:**

- README session wording that a docs test can match.
- `scripts/perf/load.mjs` using autocannon at 50 connections against Compose (`/api/ready` by default).
- Record the p95 from a real local run in the README.

**Non-Goals:**

- Running autocannon in CI (load tests stay local; the docs check only asserts README policy text).
- k6 or distributed load.

## Decisions

1. **Docs test reads README from the repo root.** Assert `/14-day idle/i` and `/30-day absolute/i` (or equivalent phrases that include 14 and 30 with idle/absolute). Place the test under `src/lib/docs/__tests__/readme.test.ts` so Vitest picks it up.

2. **autocannon as a devDependency** plus `"perf": "node scripts/perf/load.mjs"`. Default URL `http://localhost:3000/api/ready` (Compose health). `PERF_URL` override. Connections: 50. Duration: 10s so the run finishes quickly.

3. **Target `/api/ready`.** It exercises Node + Postgres, which is closer to NFR-PERF-001 than `/api/health`.

4. **Paste the measured p95 into README Hard edges / a Performance subsection** with the command used. Do not invent a number; take it from the Compose run.

## Risks / Trade-offs

- [p95 varies by machine] → Record the figure as a snapshot from this environment, with the command so others can re-run.
- [CI should not hammer Compose] → Keep the load script out of GitHub Actions.

## Migration Plan

Docs and a script only. Rollback is revert.

## Open Questions

(none)
