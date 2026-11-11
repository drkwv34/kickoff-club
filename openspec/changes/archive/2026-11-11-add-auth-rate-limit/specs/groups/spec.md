# Spec Delta

## ADDED Requirements

### Requirement: Invite mutation rate limit

The system SHALL rate-limit `POST /api/v1/groups/:id/invites` and `POST /api/v1/invites/:code/accept` per client. Excess attempts MUST return HTTP 429 with code `RATE_LIMITED`, the standard error body, and a `Retry-After` header.

#### Scenario: Excess invite attempts are rejected

- **WHEN** a client submits more invite create or accept requests than the allowed limit from the same identity
- **THEN** the next attempt returns HTTP 429
- **AND** the body `code` is `RATE_LIMITED`
- **AND** the response includes a `Retry-After` header
