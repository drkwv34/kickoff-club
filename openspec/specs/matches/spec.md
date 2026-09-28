# matches Specification

## Purpose

Timezone-aware one-off pickup matches within a group: organizers create, edit, and cancel; members list and view.

## Requirements

### Requirement: Match persistence

The database SHALL store matches with `start_at` and `end_at` as `timestamptz`, IANA `timezone` for wall-clock display, nullable `series_id` (unused for one-offs), capacity 1–200, and `status` including `scheduled` and `cancelled`.

#### Scenario: End after start

- **WHEN** a match is created or updated with `end_at` not after `start_at`
- **THEN** domain validation rejects the input

### Requirement: Create and list matches

Organizers SHALL create matches via `POST /api/v1/groups/:id/matches` (default timezone from group `home_timezone` when omitted). Members SHALL list matches via `GET /api/v1/groups/:id/matches` ordered by `start_at`.

#### Scenario: Non-organizer cannot create

- **WHEN** a non-organizer member attempts to create a match
- **THEN** the system responds with forbidden

### Requirement: Match detail and edit

Members SHALL read `GET /api/v1/matches/:id`. Organizers SHALL update via `PATCH /api/v1/matches/:id` only while `status` is `scheduled` and `start_at` is in the future.

#### Scenario: Edit blocked after start

- **WHEN** an organizer attempts to patch a match whose `start_at` is in the past
- **THEN** the system rejects the edit

### Requirement: Cancel match

Organizers SHALL cancel via `POST /api/v1/matches/:id/cancel`, setting `status` to `cancelled` without RSVP or notification side effects.

#### Scenario: Successful cancel

- **WHEN** an organizer cancels a scheduled future match
- **THEN** the match `status` becomes `cancelled`

### Requirement: Timezone display

The UI SHALL show wall time in the match timezone with a viewer-timezone hint. Domain helpers in `src/modules/matches/domain/time-display.ts` SHALL keep Bogota wall time stable and convert for viewers (including DST cases).

#### Scenario: Bogota wall time stable

- **WHEN** unit tests format a Bogota match time
- **THEN** the displayed wall time remains stable across viewer zones

### Requirement: Matches UI surfaces

The UI SHALL provide `/app/groups/:groupId/matches/new` and `/app/matches/:matchId` for create and detail flows.

#### Scenario: Member can view detail

- **WHEN** a group member opens a match detail page
- **THEN** they see match times with timezone labels
