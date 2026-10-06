# Tasks

## 1. OpenSpec planning

- [x] 1.1 Create change `add-pin-ready-closeout` with proposal, skipped specs (`skip_specs: true`), design, and this task list; verify `openspec status --change add-pin-ready-closeout` shows proposal/design/tasks done and specs skipped

## 2. Must-scope triage and docs hygiene

- [x] 2.1 Triage leftover Must bugs (GitHub issues, latest `quality` on main, SRS Must vs shipped specs); record findings in `docs/pin-ready-checklist.md` and fix only small real defects if found (verify: `gh issue list --state open` is empty or listed, and any code fix has a test or command)
- [x] 2.2 Update `.cursor/rules/kickoff-club-architecture.mdc` Day-4 scope to current pin (groups through notifications; no Should implementation) and verify the rule no longer forbids shipped match/waitlist work
- [x] 2.3 Align `docs/architecture/testing-strategy.md` CI list with `.github/workflows/ci.yml` (include demo seed ×2) and verify the numbered steps match the workflow
- [x] 2.4 Set `package.json` `version` to `0.1.0` and verify the field is no longer `0.0.0-scaffold`

## 3. Should-scope backlog (do not implement)

- [x] 3.1 Add `openspec/backlog/should-scope.md` listing FR-AUTH-004 password reset, FR-MATCH-006 filters/pagination, series this-and-future cancel, FR-NOTIF-003 preferences, FR-NOSHOW-002 unmark, and related Should items as proposal-only; verify the file states explicitly that none of these are implemented in this change

## 4. Quality-bar checklist and GitHub metadata

- [x] 4.1 Commit `docs/pin-ready-checklist.md` with every portfolio quality-bar item marked met / not met plus evidence (path, CI run, or command); verify all brief items are present
- [x] 4.2 Attempt GitHub About description + topics once via API; on 403 record **not met (manual)** in the checklist and stop (verify: API response recorded; no retry loop)

## 5. Validation

- [x] 5.1 Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, and `openspec validate add-pin-ready-closeout --strict`; verify all succeed

## Workflow follow-up

- Open a ready (non-draft) PR to `main` from `chore/pin-ready`.
- Wait for the `quality` workflow on the PR head; fix and push if it fails; merge only when green.
- After merge, archive on `main` as Christian Agila: `openspec archive add-pin-ready-closeout --yes` (add `--skip-specs` if the CLI still requests a spec sync).
- Confirm `quality` on `main`; optionally annotated-tag `v0.1.0` and create a GitHub release if the API allows.
