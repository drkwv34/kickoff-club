# rsvps Specification

## Purpose

Member RSVPs for scheduled matches with transactional capacity enforcement, waitlist enqueue when full, and FIFO auto-promotion when a going spot opens.

## Requirements

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

### Requirement: Decline, cancel, and waitlist promotion

Members SHALL decline via `POST …/rsvps` with `{ "status": "declined" }`. Members SHALL cancel their RSVP via `DELETE …/rsvps/me`, setting status to `cancelled`. When a `going` RSVP is removed and `going_count < capacity`, the system SHALL promote the earliest waitlisted RSVP (lowest `waitlist_position`, then `created_at`) to `going` within the same transaction. Each successful promotion SHALL create an in-app notification for the promoted user and attempt email delivery per the notifications capability.

#### Scenario: Cancel promotes earliest waitlisted

- **WHEN** a `going` member deletes their RSVP and at least one waitlisted player exists with capacity below full after cancel
- **THEN** the waitlisted player with position 1 becomes `going`, `going_count` increases by one, and that player receives a waitlist-promoted notification

#### Scenario: Decline from going promotes waitlist

- **WHEN** a `going` member posts `{ "status": "declined" }` and waitlisted players exist
- **THEN** the earliest waitlisted player is promoted to `going` and receives a waitlist-promoted notification

### Requirement: Waitlist promotion under concurrency

The system SHALL ensure that after any number of concurrent spot-opening mutations on the same match, `going_count` never exceeds `capacity` and promotions respect FIFO waitlist order.

#### Scenario: Parallel cancels promote without overfilling

- **WHEN** two `going` members cancel concurrently while two waitlisted members exist and capacity is 2
- **THEN** both waitlisted members become `going` and final `going_count` is 2

### Requirement: RSVP authorization

Only group members MAY create or change their own RSVP. Non-members SHALL receive forbidden.

#### Scenario: Outsider denied

- **WHEN** a user who is not a group member posts an RSVP
- **THEN** the system responds with forbidden
