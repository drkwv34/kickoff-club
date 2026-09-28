# OpenSpec — kickoff-club

This repo uses the **[Fission-AI OpenSpec](https://github.com/Fission-AI/OpenSpec)** framework (`@fission-ai/openspec` CLI), not a hand-rolled Markdown process.

## Prerequisites

- Node ≥ 20.19
- CLI (global or via `npx`):

```bash
npm install -g @fission-ai/openspec@latest
export PATH="$(npm prefix -g)/bin:$PATH"
openspec --version
```

Refresh Cursor skills and slash commands after CLI upgrades:

```bash
openspec update --force
```

## Layout

```
openspec/
  config.yaml          # schema + optional project context
  specs/               # main capability specs (source of truth)
    <capability>/spec.md
  changes/             # active change proposals (spec-driven artifacts)
  changes/archive/     # merged / historical changes
```

Legacy hand-authored `capabilities/` summaries were migrated into `specs/<capability>/spec.md`. Historical change folders live under `changes/archive/` with proposals and tasks preserved.

## Workflow (Cursor)

OpenSpec wires Cursor through generated skills and commands:

| Step | Cursor | Skill |
|------|--------|--------|
| Propose | `/opsx-propose` | `.cursor/skills/openspec-propose` |
| Implement | `/opsx-apply` | `.cursor/skills/openspec-apply-change` |
| Sync specs | `/opsx-sync` | `.cursor/skills/openspec-sync-specs` |
| Archive | `/opsx-archive` | `.cursor/skills/openspec-archive-change` |
| Refresh CLI artifacts | `/opsx-update` | `.cursor/skills/openspec-update-change` |

Typical loop:

1. **Propose** — `/opsx-propose "short description"` creates a change under `openspec/changes/` with `proposal.md`, delta specs, `design.md`, and `tasks.md` (per the `spec-driven` schema in `config.yaml`).
2. **Apply** — `/opsx-apply` implements against `tasks.md` on a feature branch.
3. **Validate** — `openspec validate <change-id> --strict` (or `pnpm openspec:validate` for repo-wide checks).
4. **Archive** — after merge, `/opsx-archive` or `openspec archive <change-id> --yes` moves the change to `changes/archive/` and updates main specs.

Use `openspec list`, `openspec status --change <id>`, and `openspec instructions` for CLI-driven status and artifact guidance.

## Gate

Non-trivial **product** work (auth, groups, matches, RSVP, etc.) needs an OpenSpec change before implementation. Tooling, CI, and docs-only work may bypass OpenSpec when product semantics do not change.

Normative FR IDs remain in the project SRS; `openspec/specs/` holds in-repo capability requirements with scenarios.

## Validation

```bash
pnpm openspec:validate          # all specs + active changes
openspec validate --changes     # active changes only
openspec validate --specs       # main specs only
```

Archived changes are excluded from default bulk validation; completed archive entries from the pre-Fission migration use `skip_specs: true` because requirements were consolidated into `specs/` manually.
