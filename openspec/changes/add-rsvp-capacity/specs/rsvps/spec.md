# Spec Delta — rsvps

## ADDED Requirements

### Requirement: RSVP persistence

The database SHALL store RSVPs in `rsvps` with `match_id`, `user_id`, `status` ∈ {`going`, `waitlisted`, `declined`, `cancelled`}, optional `waitlist_position`, timestamps, and UNIQUE(`match_id`, `user_id`).

#### Scenario: One RSVP per user per match

- **WHEN** a member RSVPs twice for the same match
- **THEN** at most one row exists for that `(match_id, user_id)` pair

### Requirement: RSVP going with capacity

Group members SHALL RSVP `going` via `POST /api/v1/matches/:id/rsvps` with body `{ "status": "going" }`. Inside a transaction locking the match row, if `going_count < capacity` the RSVP SHALL be `going`; otherwise `waitlisted` with the next `waitlist_position`. Re-posting `going` when already `going` SHALL succeed without changing state.

#### Scenario: Spot available

- **WHEN** capacity is not full and the member requests `going`
- **THEN** the RSVP status is `going` and `waitlist_position` is null

#### Scenario: Match full

- **WHEN** `going_count` equals `capacity` and the member requests `going`
- **THEN** the RSVP status is `waitlisted` with a positive `waitlist_position`

#### Scenario: Idempotent going

- **WHEN** the member posts `going` while already `going`
- **THEN** the response is success and status remains `going`

### Requirement: Decline and cancel RSVP

Members SHALL decline via `POST …/rsvps` with `{ "status": "declined" }`. Members SHALL cancel their RSVP via `DELETE …/rsvps/me`, setting status to `cancelled`. Cancelling a `going` RSVP SHALL NOT auto-promote waitlisted players (Day 8).

#### Scenario: Decline

- **WHEN** a member posts `declined`
- **THEN** status is `declined` and waitlist position is cleared

#### Scenario: Cancel without promotion

- **WHEN** a `going` member deletes their RSVP and waitlisted players exist
- **THEN** waitlisted players remain `waitlisted`

### Requirement: RSVP authorization

Only group members MAY create or change their own RSVP. Non-members SHALL receive forbidden.

#### Scenario: Outsider denied

- **WHEN** a user who is not a group member posts an RSVP
- **THEN** the system responds with forbidden

### Requirement: Match detail RSVP UI

The match detail page SHALL show RSVP controls for members on scheduled future matches, reflecting the viewer’s current status and offering going / declined / cancel actions.

#### Scenario: Member sees status

- **WHEN** a member views a scheduled match they RSVP’d as `going`
- **THEN** the UI indicates they are going
