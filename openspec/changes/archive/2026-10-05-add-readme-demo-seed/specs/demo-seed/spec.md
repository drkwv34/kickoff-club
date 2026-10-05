# Spec Delta

## Purpose

Defines the idempotent demo database seed used for README-driven local review.

## ADDED Requirements

### Requirement: Demo seed creates reviewable dataset

The system SHALL provide a `pnpm db:seed` command that, against a migrated database, ensures a demo group with one organizer and one player member, and one scheduled upcoming match in that group.

#### Scenario: First seed run

- **WHEN** `pnpm db:seed` runs against an empty database after migrations
- **THEN** users exist for documented organizer and player demo emails
- **AND** the demo group exists with organizer and player memberships
- **AND** exactly one upcoming scheduled match exists for the demo group

### Requirement: Demo seed is idempotent

The demo seed SHALL be safe to run multiple times without creating duplicate demo users, group, or match rows keyed by the stable demo identifiers.

#### Scenario: Second seed run

- **WHEN** `pnpm db:seed` runs twice in succession
- **THEN** the second run completes without error
- **AND** the count of demo users, demo group, and demo match remains one each

### Requirement: Demo credentials are documented

The README SHALL document demo login emails and a shared demo password sufficient to sign in via the existing login UI (password length ≥ 12 characters).

#### Scenario: Reviewer login

- **WHEN** a reviewer copies `.env.example` to `.env`, starts Compose, and runs the seed
- **THEN** they can sign in as organizer and player using README-documented credentials

### Requirement: CI proves seed runs cleanly

CI SHALL execute the demo seed at least twice after database migration in the quality workflow, or equivalent automated test coverage SHALL run the seed twice and assert idempotency.

#### Scenario: CI seed step

- **WHEN** the `quality` GitHub Actions job runs on a pull request
- **THEN** the demo seed command runs successfully at least twice after migrate
