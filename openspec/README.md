# OpenSpec — kickoff-club

Spec-driven development: **non-trivial feature work starts with a change proposal** in this directory, not with ad-hoc commits.

## Layout

```
openspec/
  README.md           ← you are here
  capabilities/       ← stable capability descriptions (what the product can do)
  changes/            ← proposed deltas (created per change; Day 2+ foundations live here)
```

## Workflow

1. **Identify** the capability or FR IDs affected (see SRS / `capabilities/`).
2. **Add** a folder under `changes/` named `YYYY-MM-DD-short-slug/` containing:
   - `proposal.md` — intent, scope, acceptance criteria, out of scope
   - `tasks.md` — implementation checklist (optional)
3. **Review** — for solo work, mark `Status: approved` (table + approver) in `proposal.md` when ready to implement. That **is** the in-repo approval process until a second reviewer exists.
4. **Implement** on a feature branch; reference the change id in PR title/body.
5. **Close** — merge proposal updates into `capabilities/` when the change ships.

## Gate (after bootstrap)

Once this skeleton exists on `main`, **do not** add product behavior (auth, RSVP, waitlist, etc.) without an approved proposal under `openspec/changes/`.

Scaffold-only work (tooling, CI, docs) may bypass OpenSpec when it does not change product semantics.

## Capabilities

See [`capabilities/README.md`](capabilities/README.md) for the capability index. Schema foundations for `auth` and `groups` are approved under `changes/`.
