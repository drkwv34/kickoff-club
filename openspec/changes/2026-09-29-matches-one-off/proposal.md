# Change: one-off matches and timezone display

| Field | Value |
|-------|--------|
| **ID** | `2026-09-29-matches-one-off` |
| **Status** | **implemented** |
| **Approved at** | 2026-09-29 |
| **Approver** | Christian Agila (`drkwv34`) — in-repo solo review |
| **SRS** | FR-MATCH-001, FR-MATCH-003, FR-MATCH-004, FR-MATCH-005 |
| **Capability** | `matches` |
| **Depends on** | `2026-09-26-groups-rbac` |

## Intent

Organizers create, edit, and cancel **one-off** matches for a group. Members can list and view matches. Store `start_at` / `end_at` as `timestamptz` plus IANA `timezone`; UI shows wall time in match TZ with a viewer-TZ hint.

## Scope (in)

- `matches` table (`series_id` nullable, unused for one-offs).
- CRUD APIs per SRS §4.2 (create/list on group; get/patch/cancel on match id).
- Default match `timezone` from group `home_timezone` when omitted.
- Domain validation: `endAt > startAt`, capacity 1–200, IANA timezone.
- Edit allowed only while `status = scheduled` and `start_at` is in the future.
- Cancel sets `status = cancelled` (no RSVP/notification side effects yet).
- Timezone display helpers + unit tests (Bogota + New York DST fixture).
- UI: create match form on group detail; match detail page.

## Out of scope

- Recurring series / `match_series` (Day 6).
- RSVP, waitlist, capacity vs going count (Days 7–8).
- Cancel notifications to going/waitlisted (Day 9).
- List filters / pagination (FR-MATCH-006 Should).

## API

| Method | Path | Auth | Success |
|--------|------|------|---------|
| POST | `/api/v1/groups/:id/matches` | Organizer + CSRF | 201 |
| GET | `/api/v1/groups/:id/matches` | Member | 200 |
| GET | `/api/v1/matches/:id` | Member | 200 |
| PATCH | `/api/v1/matches/:id` | Organizer + CSRF | 200 |
| POST | `/api/v1/matches/:id/cancel` | Organizer + CSRF | 200 |

## Acceptance

- [x] Organizer can create/edit/cancel; player can read; non-member 403.
- [x] Timestamps stored as timestamptz; timezone field persisted.
- [x] Unit tests: Bogota wall time stable; New York viewer sees converted hint.
- [x] UI create form + detail with TZ labels.
- [x] No series engine, RSVP, or waitlist code.

## Traceability

| Requirement | This change |
|-------------|-------------|
| FR-MATCH-001 | Create one-off match |
| FR-MATCH-003 | Edit (before start; no RSVP capacity shrink yet) |
| FR-MATCH-004 | Cancel match status |
| FR-MATCH-005 | Timezone correctness + display |
