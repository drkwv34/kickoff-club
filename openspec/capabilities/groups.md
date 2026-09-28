# Capability: groups

**Status:** implemented (Day 4) — create/join, invites, RBAC.  
**SRS:** FR-GRP-001..005.  
**OpenSpec:** [`changes/2026-09-26-groups-rbac`](../changes/2026-09-26-groups-rbac/). Schema: [`changes/2026-09-26-groups-foundation`](../changes/2026-09-26-groups-foundation/).

## What this capability does

Named local clubs with group-scoped organizer/player roles:

- `POST /api/v1/groups` — creator becomes organizer.
- `GET /api/v1/groups` — current user’s memberships.
- `GET /api/v1/groups/:id` — members only (includes member list).
- `POST /api/v1/groups/:id/invites` — organizer; default 7-day TTL, max 50 uses.
- `GET /api/v1/invites/:code` — preview (code is the secret).
- `POST /api/v1/invites/:code/accept` — join as **player**.
- `PATCH /api/v1/groups/:id/members/:userId` — promote/demote.
- `DELETE /api/v1/groups/:id/membership` — leave.

Unknown invite → 404. Expired or exhausted → 410 `GONE`. Demoting or leaving as the last organizer → 409 `LAST_ORGANIZER`.

UI: `/app` (create/list), `/app/groups/:id`, `/invite/:code`.

Authz lives in `src/modules/groups/domain/authz.ts` (no React/Next).

## Explicitly not this capability (yet)

RSVP/waitlist, real invite email (stub only). Matches are a separate capability (`matches.md`).
