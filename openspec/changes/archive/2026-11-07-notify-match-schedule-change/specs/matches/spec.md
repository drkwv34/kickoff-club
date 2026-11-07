# Spec Delta

## ADDED Requirements

### Requirement: Notify members when schedule or venue changes

When an organizer updates a scheduled match and the stored start time, end time, or venue actually changes, the system MUST notify each member whose RSVP status is `going` or `waitlisted`. A PATCH that does not change those fields MUST NOT emit schedule-update notifications.

#### Scenario: Start time change notifies going and waitlisted

- **WHEN** a match has one `going` member and one `waitlisted` member
- **AND** an organizer PATCHes a new `startAt`
- **THEN** each of those members receives one `match_updated` notification
- **AND** the mailer is invoked once per those members with the `match_updated` template

#### Scenario: Description-only edit emits none

- **WHEN** an organizer PATCHes only `description` on a match that has going or waitlisted members
- **THEN** no `match_updated` notification is created
- **AND** the mailer is not invoked with `match_updated`
