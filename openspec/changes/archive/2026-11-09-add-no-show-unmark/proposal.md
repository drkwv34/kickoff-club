# Proposal

## Why

Organizers can mark a going player as a no-show after kickoff, but a mistaken mark cannot be reversed. `no_show_count` stays inflated and there is no DELETE on the existing no-show route.

## What Changes

- Add organizer-only `DELETE /api/v1/matches/:id/no-shows/:userId` following the existing mark path.
- Delete the `no_shows` row and recompute `group_memberships.no_show_count` for that member in the match’s group.
- Show an unmark control on match detail for organizers.
- Regression: mark → count 1; DELETE → 204 and count 0; player DELETE → 403.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `matches`: Organizers MUST unmark a no-show via DELETE and the membership count MUST be recomputed.
- `app-ui`: Match detail MUST expose an unmark control for organizers when a no-show exists.

## Impact

- Matches domain/infra no-show repository and membership count write.
- New route `src/app/api/v1/matches/[matchId]/no-shows/[userId]/route.ts`.
- Match detail UI next to mark no-show.
- Integration tests for organizer success and player 403.
