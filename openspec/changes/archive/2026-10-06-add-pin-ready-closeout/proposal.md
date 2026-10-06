# Proposal

## Why

kickoff-club is at the final pin-ready closeout. Reviewers need evidence that Must-scope product work is complete, leftover Must bugs are triaged, Should-scope items (password reset and peers) are recorded without being implemented, and every portfolio quality-bar item is marked met or not met with file/CI/command evidence.

## What Changes

- Triage leftover **Must** bugs only (open GitHub issues, failing/flaky `quality` checks, SRS Must gaps). Fix small real defects; list anything deferred. No new features.
- Commit `docs/pin-ready-checklist.md` covering every portfolio quality-bar item with **met** / **not met** plus evidence (path, CI run, or command).
- Record Should-scope items as a standing OpenSpec backlog note under `openspec/` (proposal-only; do **not** implement password reset, pagination, this-and-future series cancel, notification preferences, unmark no-show, etc.).
- Attempt GitHub About description + topics once via API; if 403, document the manual fallback in the checklist (do not retry loops).
- Optional annotated tag `v0.1.0` on the merged `main` commit (and a GitHub release if the API allows).
- Keep `main` green after merge; archive this change on `main` with the Fission-AI OpenSpec CLI.

No **BREAKING** API or schema changes are planned. Product capabilities already specified under `openspec/specs/` stay as-is unless a Must-scope defect requires a tiny fix that does not change requirements.

## Capabilities

### New Capabilities

- _(none — this change is pin-ready closeout documentation and triage, not a new product capability)_

### Modified Capabilities

- _(none — no spec-level product behavior changes; Should items stay unimplemented)_

This change sets `skip_specs: true` in `.openspec.yaml` because it is docs/process closeout: a quality-bar checklist, a Should-scope backlog note, and Must-only defect triage. Inventing a `pin-ready` product spec would not describe system behavior.

## Impact

- `docs/pin-ready-checklist.md` (new)
- `openspec/backlog/should-scope.md` (new standing backlog; not a spec)
- Possibly small Must-scope docs/code fixes (agent rules Day 4 scope is stale; `docs/architecture/testing-strategy.md` CI list omits the demo-seed step; `package.json` version is still `0.0.0-scaffold`)
- GitHub repository About description + topics (best-effort API)
- Optional `v0.1.0` tag after merge
- No courier-outbox work, no profile README repo, no Should-scope implementation, no rewrite
