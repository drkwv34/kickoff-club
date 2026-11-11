# Spec Delta

## ADDED Requirements

### Requirement: Auth mutation rate limit

The system SHALL rate-limit `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/password-reset`, and `POST /api/v1/auth/password-reset/confirm` per client. Excess attempts MUST return HTTP 429 with code `RATE_LIMITED`, the standard error body, and a `Retry-After` header.

#### Scenario: Excess failed logins are rejected

- **WHEN** a client submits more failed login attempts than the allowed limit from the same identity
- **THEN** the next attempt returns HTTP 429
- **AND** the body `code` is `RATE_LIMITED`
- **AND** the response includes a `Retry-After` header
