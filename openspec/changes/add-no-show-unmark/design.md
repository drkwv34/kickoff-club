# Design

## Context

See proposal.md for motivation. Mark lives at `POST /api/v1/matches/:id/no-shows` and increments `no_show_count`. There is no delete on the no-show repository. `loadMatchForOrganizer` already enforces organizer-only access. Domain must not import `next/*`.

## Goals / Non-Goals

**Goals:**

- DELETE by match id and user id, organizer only, CSRF like other mutating routes.
- Recompute membership `no_show_count` from remaining `no_shows` in that group.
- Unmark button on match detail.

**Non-Goals:**

- Editing who marked the row.
- Bulk unmark.
- Changing when marking is allowed.

## Decisions

1. **Path `DELETE /api/v1/matches/:id/no-shows/:userId`.** Mirrors the mark collection route with the target in the path, matching the brief. Alternative: DELETE on the collection with a body — rejected so GET-less DELETE stays idempotent on a resource URL.

2. **204 empty body.** Success has no payload; clients refresh match detail.

3. **Recompute, do not decrement.** Count remaining `no_shows` for that user among matches in the group so a missed increment cannot drift. Missing row is 404.

4. **Same CSRF as POST mark.** `assertCsrf` then `requireSession`, then domain.

5. **UI lists marked players with Unmark.** Filter marked users out of the mark dropdown to avoid a 409.

## Risks / Trade-offs

- [Count includes no-shows on cancelled matches] → accepted; audit rows remain until unmarked.
- [Unmark after match] → allowed whenever the row exists; organizers can correct mistakes.

## Migration Plan

No schema change. Rollback is revert of the route, domain, and UI.

## Open Questions

(none)
