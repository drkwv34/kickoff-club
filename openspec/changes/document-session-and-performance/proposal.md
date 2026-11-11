# Proposal

## Why

The session idle/absolute TTLs live only in `session.ts` and architecture notes; the README a reviewer actually reads does not state them. NFR-PERF-001 also requires a `scripts/perf/` load script and a recorded p95, which are missing.

## What Changes

- Document the session policy from `session.ts` in the README: 14-day idle TTL and 30-day absolute TTL.
- Add `scripts/perf/` with an autocannon script using 50 connections, meant to run against local Compose.
- Record the measured p95 latency in the README.
- Add a docs check that the README contains the session policy.

## Capabilities

### New Capabilities

- `performance`: Local Compose load script (50 connections) and a README p95 figure.

### Modified Capabilities

- `auth`: README MUST document the 14-day idle and 30-day absolute session policy.

## Impact

- `README.md`
- `scripts/perf/` (autocannon)
- Vitest docs check for the session policy
- `package.json` / lockfile if autocannon is added as a dependency
