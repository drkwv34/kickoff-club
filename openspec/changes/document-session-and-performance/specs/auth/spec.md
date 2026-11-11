# Spec Delta

## ADDED Requirements

### Requirement: Session policy documented in README

The README SHALL document the session idle TTL of 14 days and the absolute TTL of 30 days from session creation, matching `src/modules/auth/domain/session.ts`.

#### Scenario: README states idle and absolute TTL

- **WHEN** a reviewer reads the README session documentation
- **THEN** it states a 14-day idle window
- **AND** it states a 30-day absolute cap
