# Spec Delta

## ADDED Requirements

### Requirement: Unmark no-show

Organizers SHALL unmark a no-show via `DELETE /api/v1/matches/:id/no-shows/:userId`. The system MUST delete the `no_shows` row for that match and user and recompute `group_memberships.no_show_count` for that user in the match’s group. Non-organizers MUST receive forbidden.

#### Scenario: Organizer unmarks no-show

- **WHEN** an organizer has marked a going player as no-show
- **AND** the organizer DELETEs `/api/v1/matches/:id/no-shows/:userId`
- **THEN** the response is HTTP 204
- **AND** that membership `no_show_count` is 0 when no other no-shows remain

#### Scenario: Player cannot unmark

- **WHEN** a non-organizer member DELETEs `/api/v1/matches/:id/no-shows/:userId`
- **THEN** the system responds with forbidden
