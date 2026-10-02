# Spec Delta

## MODIFIED Requirements

### Requirement: Decline, cancel, and waitlist promotion

Members SHALL decline via `POST …/rsvps` with `{ "status": "declined" }`. Members SHALL cancel their RSVP via `DELETE …/rsvps/me`, setting status to `cancelled`. When a `going` RSVP is removed and `going_count < capacity`, the system SHALL promote the earliest waitlisted RSVP (lowest `waitlist_position`, then `created_at`) to `going` within the same transaction. Each successful promotion SHALL create an in-app notification for the promoted user and attempt email delivery per the notifications capability.

#### Scenario: Cancel promotes earliest waitlisted

- **WHEN** a `going` member deletes their RSVP and at least one waitlisted player exists with capacity below full after cancel
- **THEN** the waitlisted player with position 1 becomes `going`, `going_count` increases by one, and that player receives a waitlist-promoted notification

#### Scenario: Decline from going promotes waitlist

- **WHEN** a `going` member posts `{ "status": "declined" }` and waitlisted players exist
- **THEN** the earliest waitlisted player is promoted to `going` and receives a waitlist-promoted notification
