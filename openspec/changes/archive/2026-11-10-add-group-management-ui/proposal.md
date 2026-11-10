# Proposal

## Why

The groups and matches APIs already support promoting and demoting members, leaving a group, listing `noShowCount`, and editing a match. The group and match pages do not expose those actions, so organizers and players cannot manage membership or update a match without calling the API.

## What Changes

- Show each member’s role and no-show count on the group members list.
- Add promote, demote, and leave controls that call the existing member and membership endpoints, and surface `409 LAST_ORGANIZER` in the UI.
- Add an Edit match form that PATCHes the existing match endpoint.
- Add a Playwright regression that an organizer promotes, demotes, and edits a match, a player leaves, and the members list shows no-show counts.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `app-ui`: Group members list MUST show roles, no-show counts, and promote/demote/leave controls; match detail MUST offer an edit form for organizers.
- `e2e`: Playwright MUST cover organizer promote/demote/edit, player leave, and visible no-show counts.

## Impact

- Group detail members section and a client member-management component.
- Match detail (or dedicated edit page) using `PATCH /api/v1/matches/:id`.
- Existing `PATCH /api/v1/groups/:id/members/:userId` and `DELETE /api/v1/groups/:id/membership` (no API contract change).
- Playwright e2e under `e2e/`.
