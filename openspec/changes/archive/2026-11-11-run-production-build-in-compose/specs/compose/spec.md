# Spec Delta

## Purpose

Defines the Docker Compose app image as a production Next.js server that still supports migrations and the documented demo seed.

## ADDED Requirements

### Requirement: Compose app runs the production server

The Compose `app` service SHALL start with `pnpm start` from an image that already ran `next build`. The default command MUST NOT be `pnpm dev`.

#### Scenario: Default container command is production start

- **WHEN** the app image is built from the repository Dockerfile
- **THEN** the image default command is `pnpm start`
- **AND** the Dockerfile does not use `pnpm dev` as the default command

### Requirement: Seed remains available in the app image

The production app image SHALL still run `pnpm db:seed` so reviewers can seed via `docker compose exec app pnpm db:seed` after the stack is up.

#### Scenario: Seed command exists in the app image

- **WHEN** a reviewer starts Compose and executes `pnpm db:seed` in the `app` service
- **THEN** the command is present in the image and can apply the demo seed against the Compose database
