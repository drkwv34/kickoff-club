# Spec Delta

## ADDED Requirements

### Requirement: Mark no-show after start

Organizers SHALL mark a player as no-show via `POST /api/v1/matches/:id/no-shows` with body `{ "userId": "<uuid>" }` only after the match `start_at` has passed. The target user SHALL have been `going` for that match. The system SHALL increment `group_memberships.no_show_count` for that user in the match’s group and record a `no_shows` row.

#### Scenario: Organizer marks no-show

- **WHEN** an organizer posts no-show for a `going` player after `start_at`
- **THEN** the response is 201 and the membership `no_show_count` increases by one

#### Scenario: Before start forbidden

- **WHEN** an organizer attempts to mark no-show before `start_at`
- **THEN** the system responds with conflict

#### Scenario: Non-organizer forbidden

- **WHEN** a non-organizer member posts no-show
- **THEN** the system responds with forbidden

#### Scenario: Not going forbidden

- **WHEN** the target user was not `going` for the match
- **THEN** the system responds with conflict
