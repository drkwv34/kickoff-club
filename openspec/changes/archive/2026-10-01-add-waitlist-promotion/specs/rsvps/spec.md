# rsvps — delta

## REMOVED Requirements

### Requirement: Decline and cancel RSVP

Day 7 behavior did not promote waitlisted players when a going RSVP was removed; Day 8 adds FIFO auto-promotion in the same transaction.

**Migration:** Clients already receive updated RSVP status on cancel/decline; no API shape change.

#### Scenario: Cancel without promotion

- **WHEN** a `going` member deletes their RSVP and waitlisted players exist
- **THEN** waitlisted players remain `waitlisted`

## ADDED Requirements

### Requirement: Decline, cancel, and waitlist promotion

Members SHALL decline via `POST …/rsvps` with `{ "status": "declined" }`. Members SHALL cancel their RSVP via `DELETE …/rsvps/me`, setting status to `cancelled`. When a `going` RSVP is removed and `going_count < capacity`, the system SHALL promote the earliest waitlisted RSVP (lowest `waitlist_position`, then `created_at`) to `going` within the same transaction.

#### Scenario: Cancel promotes earliest waitlisted

- **WHEN** a `going` member deletes their RSVP and at least one waitlisted player exists with capacity below full after cancel
- **THEN** the waitlisted player with position 1 becomes `going` and `going_count` increases by one

#### Scenario: Decline from going promotes waitlist

- **WHEN** a `going` member posts `{ "status": "declined" }` and waitlisted players exist
- **THEN** the earliest waitlisted player is promoted to `going`

### Requirement: Waitlist promotion under concurrency

The system SHALL ensure that after any number of concurrent spot-opening mutations on the same match, `going_count` never exceeds `capacity` and promotions respect FIFO waitlist order.

#### Scenario: Parallel cancels promote without overfilling

- **WHEN** two `going` members cancel concurrently while two waitlisted members exist and capacity is 2
- **THEN** both waitlisted members become `going` and final `going_count` is 2
