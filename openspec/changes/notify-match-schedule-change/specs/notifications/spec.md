# Spec Delta

## ADDED Requirements

### Requirement: Match updated event type

The system SHALL persist and email a `match_updated` notification when a match start, end, or venue change is published for a recipient. Payload MUST include `matchId` and `matchTitle`. Email send failures MUST NOT roll back the in-app row.

#### Scenario: In-app row for schedule change

- **WHEN** a `match_updated` event is published for a user
- **THEN** a notification row exists for that user with type `match_updated` and a payload that includes `matchId`

## MODIFIED Requirements

### Requirement: Supported event types

The system SHALL create in-app notifications for at minimum: invite received, RSVP confirmed, waitlist promoted, match cancelled, no-show marked (to the affected player), and match updated (to going and waitlisted members when start, end, or venue changes).

#### Scenario: Waitlist promoted

- **WHEN** a waitlisted member is promoted to `going`
- **THEN** that member receives a `waitlist_promoted` notification

#### Scenario: Match schedule updated

- **WHEN** a going or waitlisted member is notified of a start, end, or venue change
- **THEN** that member receives a `match_updated` notification
