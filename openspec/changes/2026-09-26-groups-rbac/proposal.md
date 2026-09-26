# Change: groups, invites, and RBAC

| Field | Value |
|-------|--------|
| **ID** | `2026-09-26-groups-rbac` |
| **Status** | **approved** |
| **Approved at** | 2026-09-26 |
| **Approver** | Christian Agila (`drkwv34`) — in-repo solo review |
| **SRS** | FR-GRP-001, FR-GRP-002, FR-GRP-003, FR-GRP-004, FR-GRP-005 (Should, member list on detail) |
| **Capability** | `groups` |
| **Depends on** | `2026-09-26-groups-foundation` (tables), `2026-09-26-auth-sessions` |

## Intent

Ship group create/join, invite codes, organizer/player roles, and last-organizer protection on top of the Day 2 `groups` / `group_memberships` tables. No matches, waitlists, or real invite email.

## Scope (in)

- Create group: authenticated user becomes **organizer** (group + membership in one transaction).
- List memberships; get group (members only).
- Organizer generates invite code/link: default **7 days**, **max 50 uses** (organizer may set `maxUses` 1–50).
- Accept invite (authenticated): join as **player**. Expired/exhausted → 410 `GONE`; unknown code → 404.
- Promote player → organizer and demote organizer → player. Demoting or leaving as the last organizer → 409 `LAST_ORGANIZER`.
- Leave group (membership delete) with the same last-organizer rule. RSVP cancellation is N/A until matches exist.
- Pure authz helpers in `src/modules/groups/domain` (no React/Next imports).
- Minimal UI: create group, list groups, accept invite by code/link.
- Invite email: **stub only** (optional `email` field ignored beyond a no-op helper).

## Out of scope

- Match create/edit/cancel (Day 5).
- Waitlist / RSVP (Days 7–8).
- Real invite email body or Mailpit send (Day 9).
- Password reset, OAuth.

## Invite policy (normative)

- Table `group_invites`: unique `code`, `expires_at`, `max_uses`, `use_count`, `created_by`.
- Accept increments `use_count` inside a transaction with a row lock on the invite.
- Default TTL 7 days from `created_at`; default `max_uses` 50.
- Invite link path: `/invite/:code` (UI) corresponding to `POST /api/v1/invites/:code/accept`.

## API

| Method | Path | Auth | Success |
|--------|------|------|---------|
| POST | `/api/v1/groups` | User + CSRF | 201 |
| GET | `/api/v1/groups` | User | 200 |
| GET | `/api/v1/groups/:id` | Member | 200 |
| POST | `/api/v1/groups/:id/invites` | Organizer + CSRF | 201 |
| GET | `/api/v1/invites/:code` | Public (code is secret) | 200 |
| POST | `/api/v1/invites/:code/accept` | User + CSRF | 200 |
| PATCH | `/api/v1/groups/:id/members/:userId` | Organizer + CSRF | 200 |
| DELETE | `/api/v1/groups/:id/membership` | Member + CSRF | 204 |

## Acceptance

- [ ] Creator is organizer; invitee joins as player.
- [ ] Unknown invite code → 404; expired or max-uses exhausted → 410 `GONE`.
- [ ] Single-use (`maxUses: 1`) second accept fails; multi-use respects max.
- [ ] Demote/leave last organizer → 409 `LAST_ORGANIZER`.
- [ ] Non-member cannot view group or create invites (403).
- [ ] Domain authz has no `react` / `next` imports; matrix unit tests cover actor × action.
- [ ] UI can create a group and accept an invite.

## Traceability

| Requirement | This change |
|-------------|-------------|
| FR-GRP-001 | Create group + organizer membership |
| FR-GRP-002 | Invite codes, expiry, max uses, accept as player |
| FR-GRP-003 | Promote/demote + `LAST_ORGANIZER` |
| FR-GRP-004 | Leave group + last-organizer (no RSVP side effects yet) |
| FR-GRP-005 | Member list on group detail (members only) |
| FR-ERR-* | Existing domain error mapper (409/410/403/404) |
