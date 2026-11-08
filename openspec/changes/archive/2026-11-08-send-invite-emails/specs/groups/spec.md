# Spec Delta

## ADDED Requirements

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
