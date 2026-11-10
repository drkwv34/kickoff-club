# Design

## Context

See proposal.md for motivation. `PATCH /api/v1/groups/:id/members/:userId`, `DELETE /api/v1/groups/:id/membership`, and `PATCH /api/v1/matches/:id` already exist. Group detail renders members as static name+role list items. Match detail has cancel and RSVP, not edit. Domain must not import `next/*`.

## Goals / Non-Goals

**Goals:**

- Client controls on the members list for promote, demote, leave, and last-organizer errors.
- Visible `noShowCount` per member.
- Organizer edit form that PATCHes the existing match route.

**Non-Goals:**

- New role or leave APIs, kicking other members, or changing last-organizer rules.
- Editing cancelled matches.
- Field-error rendering on other forms (separate change).

## Decisions

1. **Client member list on group detail.** Group page stays a server component and passes members, viewer id, and role into a client list that calls the existing JSON APIs with CSRF. Alternative: server actions — rejected to match invite/RSVP fetch + CSRF.

2. **Leave is self-only; promote/demote are organizer-only on other members.** Matches the API. The sole organizer still sees Leave so `LAST_ORGANIZER` can be shown instead of hiding the control.

3. **Dedicated `/app/matches/[matchId]/edit` page.** Same pattern as create-match. Alternative: inline form on match detail — rejected so match detail stays RSVP-focused and the edit form can reuse create-match field layout.

4. **Edit form sends labeled fields present in the form.** Convert wall-clock date/time in the match timezone to ISO instants using the existing wall-clock helper. Empty description is sent as `""` so PATCH can clear it.

5. **No-show count is plain text next to the role badge** (`N no-shows`) so the list stays readable without a new table.

## Risks / Trade-offs

- [Self-demote as last organizer] → API returns 409; UI shows `message` from the body.
- [Stale member list after promote] → update the client list from the PATCH response; leave redirects to `/app`.
- [Edit after match start] → still allowed for `scheduled` matches; cancelled matches have no edit link.

## Migration Plan

No schema change. Rollback is revert of the UI components, edit page, and e2e.

## Open Questions

(none)
