# Change: groups schema foundation

| Field | Value |
|-------|--------|
| **ID** | `2026-09-26-groups-foundation` |
| **Status** | **approved** |
| **Approved at** | 2026-09-26 |
| **Approver** | Christian Agila (`drkwv34`) — in-repo solo review |
| **SRS** | FR-GRP-001, FR-GRP-003 (schema stubs for authz next) |
| **Capability** | `groups` |

## Intent

Persist **groups** and **memberships** so Day 4 RBAC (organizer vs player, last-organizer) has tables to hang off. This is a skeleton: no create-group API, invites, or UI.

## Scope (in)

- `groups` table: uuid PK, `name`, `sport_default` (SRS sport enum), `home_timezone` (IANA), optional `description`, `created_by` FK → `users`, `created_at`.
- `group_memberships` table: `(group_id, user_id)` unique, `role` ∈ {`organizer`,`player`}, `no_show_count` default 0, `joined_at`.
- FKs with sensible delete behavior (memberships cascade with group/user; `groups.created_by` restrict).
- Domain error code stub `LAST_ORGANIZER` (HTTP 409) already sketched in Day 1 — keep/extend, do not implement the rule yet.

## Out of scope

- Group create/list/join APIs or UI (Day 4).
- Invites (`group_invites`) — Day 4.
- Role promote/demote / last-organizer enforcement (Day 4).
- Matches, RSVPs, waitlists.

## Acceptance

- [x] Migration creates `groups` and `group_memberships` on a fresh database.
- [x] Sport and membership-role enums match SRS Appendix A.
- [x] Unique `(group_id, user_id)` prevents duplicate memberships.
- [x] No groups product UI or `/api/v1/groups` handlers.

## Traceability

| Requirement | This change |
|-------------|-------------|
| FR-GRP-001 creator becomes organizer | Columns exist; use-case later |
| FR-GRP-003 last organizer | `role` column + `LAST_ORGANIZER` error code stub |
| FR-NOSHOW-001 no-show count | `no_show_count` on memberships (increment later) |
