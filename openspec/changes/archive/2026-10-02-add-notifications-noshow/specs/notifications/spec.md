# Spec Delta

## Purpose

Persist per-user in-app notifications and deliver key match events via a pluggable email adapter (Mailpit in local Compose).

## ADDED Requirements

### Requirement: Notification persistence

The system SHALL store notifications with `user_id`, `type`, `payload_json`, optional `read_at`, and `created_at`, indexed for listing by user newest-first.

#### Scenario: Row created on event

- **WHEN** a supported notification event occurs for a user
- **THEN** a notification row exists for that user with the event type and payload

### Requirement: List and mark read APIs

Authenticated users SHALL list notifications via `GET /api/v1/notifications` and mark notifications read via `POST /api/v1/notifications/read` with body listing notification ids or `{ "all": true }`.

#### Scenario: Unread count

- **WHEN** a user has unread notifications
- **THEN** the list response includes an unread count and each item exposes read state

#### Scenario: Mark read

- **WHEN** a user posts valid notification ids they own
- **THEN** those rows have `read_at` set and no longer count as unread

### Requirement: Supported event types

The system SHALL create in-app notifications for at minimum: invite received, RSVP confirmed, waitlist promoted, match cancelled, and no-show marked (to the affected player).

#### Scenario: Waitlist promoted

- **WHEN** a waitlisted member is promoted to `going`
- **THEN** that member receives a `waitlist_promoted` notification

### Requirement: Email adapter

The system SHALL send email through a `NotificationMailer` port. Local development SHALL use SMTP to Mailpit (Compose `mail` service on port 1025). Email send failures SHALL NOT roll back committed in-app notification rows.

#### Scenario: Promotion email attempt

- **WHEN** a user is promoted from the waitlist and SMTP is configured
- **THEN** an email is attempted to the user’s registered address and may appear in Mailpit
