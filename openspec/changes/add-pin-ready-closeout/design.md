# Design

## Context

See `proposal.md` for motivation. kickoff-club on `main` already ships Must-scope product (auth sessions, groups/RBAC, matches + series, RSVP capacity + waitlist, notifications/no-shows, Playwright e2e, README + demo seed). GitHub has **zero open issues**. Latest `quality` run on `main` (`eab2596`, workflow run `37251819342`) succeeded. Domain layers and `/api/v1` stay untouched unless triage finds a small Must defect.

## Goals / Non-Goals

**Goals:**

- Evidence-first closeout: every quality-bar item in `docs/pin-ready-checklist.md` is **met** or **not met** with a concrete path, CI run id, or command.
- Standing Should-scope backlog under `openspec/` that survives archive (not only the change proposal).
- Honest triage: if nothing Must-scope is broken, say so; still fix tiny docs inaccuracies that would fail the quality bar (stale agent Day-4 scope, CI list missing seed).

**Non-Goals:**

- Spec deltas for product capabilities (this change uses `skip_specs: true`).
- Implementing any Should item, courier-outbox, or profile README.
- Rewriting README, Compose, or CI unless a Must defect is proven.

## Decisions

### 1. Skip spec deltas

- **Choice:** `skip_specs: true`. Closeout docs are not product behavior; inventing a `pin-ready` capability would fail the “durable system behavior” rule.
- **Alternative:** Add a `pin-ready` spec. Rejected — `openspec validate` would then require SHALL/WHEN/THEN for a checklist file, which is process not product.

### 2. Standing backlog path

- **Choice:** `openspec/backlog/should-scope.md` (proposal-only note; no tasks to implement). Archive moves the change folder but this file stays in-tree.
- **Alternative:** Only list Should items in this change’s `proposal.md`. Rejected — archive would bury the only backlog record.

### 3. Quality-bar evidence format

- **Choice:** One markdown table (or heading per item) with columns: item, status (`met` / `not met`), evidence. About/topics: try `gh api` PATCH once; on 403, mark **not met** (manual) and stop.
- **Alternative:** Claim About is met because README already lists the blurb. Rejected — the bar is the GitHub repository metadata, not a README fallback.

### 4. Tiny Must-scope docs hygiene (not features)

- **Choice:** Update `.cursor/rules/kickoff-club-architecture.mdc` so “Day 4 scope” no longer forbids matches/waitlist (agents would otherwise ignore shipped features). Align `docs/architecture/testing-strategy.md` CI list with `.github/workflows/ci.yml` (seed ×2). Bump `package.json` `version` from `0.0.0-scaffold` to `0.1.0` so it matches the optional tag.
- **Alternative:** Leave them stale. Rejected — “rules + agentic docs first” and “trustworthy Compose/CI story” would be weaker evidence.

### 5. Tag and merge order

- **Choice:** Merge the PR only after `quality` is green on the PR head. Archive on `main` as a direct Christian Agila commit (`openspec archive add-pin-ready-closeout --yes`; `--skip-specs` because skip_specs is already declared). Optional annotated `v0.1.0` on the post-archive `main` SHA if tagging is allowed.
- **Alternative:** Tag the PR head. Rejected — pin version should point at merged `main`.

## Risks / Trade-offs

- [GitHub About PATCH returns 403] → Record as **not met (manual)** in the checklist; do not loop.
- [No Must bugs exist] → Checklist triage section states “none found”; do not invent product work.
- [Co-author hook reintroduces trailers] → Local `commit-msg.cursor.co-author` is a no-op; verify every commit message before push.
- [Archive `--skip-specs` vs `--yes` only] → Prefer `--yes` first; add `--skip-specs` if the CLI still wants a spec sync that skip_specs already declined.

## Migration Plan

Not applicable (no schema or API migration). Rollback is revert of the closeout commits on `main`.

## Open Questions

None that affect approach or tasks. Tag `v0.1.0` is optional per the Day 13 brief; attempt after archive if `git`/`gh` allow it.
