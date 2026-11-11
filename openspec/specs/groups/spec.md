# groups Specification

## Purpose

Named local clubs with memberships, invite codes, and organizer/player RBAC including last-organizer protection.

## Requirements

### Requirement: Groups persistence foundation

The database SHALL provide `groups` (uuid PK, `name`, `sport_default`, IANA `home_timezone`, optional `description`, `created_by` FK → `users`, `created_at`) and `group_memberships` (unique `(group_id, user_id)`, `role` ∈ {`organizer`,`player`}, `no_show_count` default 0, `joined_at`) with appropriate FK delete behavior.

#### Scenario: Membership uniqueness

- **WHEN** a second membership row is inserted for the same group and user
- **THEN** the database rejects the duplicate

### Requirement: Create and list groups

Authenticated users SHALL create groups via `POST /api/v1/groups` (creator becomes organizer) and list their memberships via `GET /api/v1/groups`.

#### Scenario: Creator is organizer

- **WHEN** a user creates a group
- **THEN** they are recorded as an organizer for that group in the same transaction

### Requirement: Group detail for members

`GET /api/v1/groups/:id` SHALL return group detail including the member list only for members; non-members SHALL be forbidden.

#### Scenario: Non-member denied

- **WHEN** a non-member requests group detail
- **THEN** the system responds with forbidden

### Requirement: Invite codes

Organizers SHALL create invites via `POST /api/v1/groups/:id/invites` with default 7-day TTL and max 50 uses (configurable 1–50). `GET /api/v1/invites/:code` SHALL preview an invite. `POST /api/v1/invites/:code/accept` SHALL join the authenticated user as **player**, incrementing `use_count` in a transaction with a row lock.

#### Scenario: Unknown invite

- **WHEN** a client uses an unknown invite code
- **THEN** the system responds with 404

#### Scenario: Expired or exhausted invite

- **WHEN** an invite is past `expires_at` or `use_count` reached `max_uses`
- **THEN** the system responds with 410 `GONE`

### Requirement: Role changes and last organizer

Organizers SHALL promote/demote via `PATCH /api/v1/groups/:id/members/:userId`. Members SHALL leave via `DELETE /api/v1/groups/:id/membership`. Demoting or leaving as the last organizer SHALL return 409 `LAST_ORGANIZER`.

#### Scenario: Last organizer cannot leave

- **WHEN** the sole organizer attempts to leave the group
- **THEN** the system responds with 409 `LAST_ORGANIZER`

### Requirement: Groups UI surfaces

The UI SHALL provide `/app` (create/list groups), `/app/groups/:id`, and `/invite/:code` for invite acceptance. Authorization rules SHALL live in domain code without React/Next imports.

#### Scenario: Invite link path

- **WHEN** a user opens `/invite/:code` and accepts while authenticated
- **THEN** they join the group as a player

### Requirement: Invite email on create

When an organizer creates an invite and the request includes an email address, the system MUST send exactly one email to that address through the existing notification mailer. The message MUST include the invite code or the accept link. Creating an invite without an email MUST NOT send mail. A mailer failure MUST NOT roll back the created invite.

#### Scenario: Invite with email sends one message

- **WHEN** an organizer posts `POST /api/v1/groups/:id/invites` with `{ "maxUses": 5, "email": "<addr>" }`
- **THEN** the response is HTTP 201
- **AND** the mailer is invoked exactly once with that address
- **AND** the message payload or body contains the invite code or accept link

#### Scenario: Invite without email sends none

- **WHEN** an organizer creates an invite without an `email` field
- **THEN** the response is HTTP 201
- **AND** the mailer is not invoked

### Requirement: Invite mutation rate limit

The system SHALL rate-limit `POST /api/v1/groups/:id/invites` and `POST /api/v1/invites/:code/accept` per client. Excess attempts MUST return HTTP 429 with code `RATE_LIMITED`, the standard error body, and a `Retry-After` header.

#### Scenario: Excess invite attempts are rejected

- **WHEN** a client submits more invite create or accept requests than the allowed limit from the same identity
- **THEN** the next attempt returns HTTP 429
- **AND** the body `code` is `RATE_LIMITED`
- **AND** the response includes a `Retry-After` header
