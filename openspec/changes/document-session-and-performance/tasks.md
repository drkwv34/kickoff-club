# Tasks

## 1. Regression coverage

- [ ] 1.1 Add a Vitest docs check that README states the 14-day idle and 30-day absolute session policy. Confirm it fails before the README is updated.

## 2. README, script, and measured p95

- [ ] 2.1 Document the session policy in README, add `scripts/perf/` autocannon (50 connections) against Compose, run it locally, and record the measured p95 in README. Verify 1.1 passes.

## 3. Validation

- [ ] 3.1 Run `openspec validate document-session-and-performance --strict` and confirm it exits 0.
