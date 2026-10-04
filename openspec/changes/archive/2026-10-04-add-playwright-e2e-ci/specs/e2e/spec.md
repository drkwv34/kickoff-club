# Spec Delta

## Purpose

Defines automated browser verification of the product critical path and how CI runs those tests against a real Postgres database.

## ADDED Requirements

### Requirement: Critical path e2e covers RSVP waitlist promotion

The system SHALL provide Playwright tests that exercise, in a real browser against a running app and database: user registration, group creation, invite-based second member join, match creation with limited capacity, first member RSVP going, second member waitlisted, first member cancel RSVP, and second member promoted to going.

#### Scenario: Waitlist promotion after cancel

- **WHEN** two members belong to a group and a match has capacity one
- **AND** the first member RSVPs going and the second is waitlisted
- **AND** the first member cancels their RSVP
- **THEN** the second member's RSVP status becomes going in the UI

### Requirement: Critical path e2e covers organizer no-show marking

The system SHALL provide a Playwright test that an organizer can mark a going player as no-show after the match start time has passed.

#### Scenario: Organizer marks no-show

- **WHEN** a scheduled match has started and a member is going
- **AND** the organizer views the match detail page
- **THEN** the organizer can submit mark no-show and see success feedback

### Requirement: E2e tests use stable selectors and flake controls

E2e tests SHALL prefer accessible role and label selectors over brittle CSS. In CI, Playwright SHALL use at most one retry per test and a single worker. Test identities SHALL use unique emails per run to avoid collisions on reruns.

#### Scenario: CI retry policy

- **WHEN** tests run with `CI=true`
- **THEN** Playwright is configured with retries of one and one worker

### Requirement: CI runs build and Playwright after unit tests

GitHub Actions SHALL run, in order: lint, typecheck, database migrate and verify, Vitest unit/integration, production build, and Playwright e2e with Postgres available and Playwright browsers installed.

#### Scenario: Pull request pipeline

- **WHEN** a pull request targets `main`
- **THEN** the workflow completes all gates including Playwright without manual steps
