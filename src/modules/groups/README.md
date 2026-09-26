# groups module

Groups, memberships, invites, RBAC (FR-GRP-001..005).

- `domain/` — create/list/get, invites, promote/demote, leave; **pure authz** (no React/Next).
- `infra/` — Drizzle repositories + invite code generator. Invite email is a no-op stub.
- HTTP wiring lives in `src/app/api/v1/groups/` and `src/app/api/v1/invites/`.
