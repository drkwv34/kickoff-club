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

### Requirement: Match series persistence

The database SHALL store recurring rules in `match_series` (`id`, `group_id`, `rrule_json`, `created_at`). Each generated match SHALL reference `series_id`. One-off matches keep `series_id` null.

#### Scenario: Series row created with instances

- **WHEN** an organizer creates a valid weekly series
- **THEN** one `match_series` row exists and every generated match shares its `series_id`

### Requirement: Create recurring series

Organizers SHALL create a series via `POST /api/v1/groups/:id/series` with the same match fields as one-off creation plus recurrence: `freq` = `weekly`, `interval` 1–4, `byWeekday` (non-empty array of `MO`–`SU`), and exactly one of `count` (1–52) or `until` (ISO date). The server SHALL materialize all match instances up front (not lazy) within the limit.

#### Scenario: Count-based expansion

- **WHEN** recurrence specifies `count` = N and the rule yields N instances within 52
- **THEN** the response includes the series and N scheduled matches ordered by `start_at`

#### Scenario: Until-based expansion

- **WHEN** recurrence specifies `until` and the rule yields at most 52 instances on or before that local date in the match timezone
- **THEN** all instances are created and none occur after `until` in match local date

#### Scenario: Over 52 instances

- **WHEN** the recurrence rule would produce more than 52 instances
- **THEN** the system responds with HTTP 400 validation error

#### Scenario: Non-organizer cannot create series

- **WHEN** a non-organizer attempts to create a series
- **THEN** the system responds with forbidden

### Requirement: Cancel series

Organizers SHALL cancel an entire series via `POST /api/v1/series/:id/cancel`, setting `status` = `cancelled` on all scheduled matches in that series. Cancelling a single instance SHALL remain `POST /api/v1/matches/:id/cancel` without affecting sibling instances.

#### Scenario: Cancel entire series

- **WHEN** an organizer cancels a series with multiple scheduled future matches
- **THEN** every scheduled match in that series becomes `cancelled`

#### Scenario: Cancel single instance unchanged

- **WHEN** an organizer cancels one match in a series
- **THEN** only that match is `cancelled` and other series instances stay scheduled

### Requirement: Series create UI

The UI SHALL provide a minimal form to create a weekly series for a group (recurrence fields aligned with the API).

#### Scenario: Organizer opens series form

- **WHEN** an organizer navigates to the group series create page
- **THEN** they can submit weekly recurrence and land on the first created match detail or group matches list

### Requirement: Mark no-show after start

Organizers SHALL mark a player as no-show via `POST /api/v1/matches/:id/no-shows` with body `{ "userId": "<uuid>" }` only after the match `start_at` has passed. The target user SHALL have been `going` for that match. The system SHALL increment `group_memberships.no_show_count` for that user in the match’s group and record a `no_shows` row.

#### Scenario: Organizer marks no-show

- **WHEN** an organizer posts no-show for a `going` player after `start_at`
- **THEN** the response is 201 and the membership `no_show_count` increases by one

#### Scenario: Before start forbidden

- **WHEN** an organizer attempts to mark no-show before `start_at`
- **THEN** the system responds with conflict

#### Scenario: Non-organizer forbidden

- **WHEN** a non-organizer member posts no-show
- **THEN** the system responds with forbidden

#### Scenario: Not going forbidden

- **WHEN** the target user was not `going` for the match
- **THEN** the system responds with conflict

### Requirement: Capacity floor on match edit

Organizers SHALL NOT lower match capacity below the count of RSVPs with status `going`. `PATCH /api/v1/matches/:id` with such a capacity MUST return HTTP 409 with code `CAPACITY_BELOW_RSVPS` and MUST leave stored capacity unchanged. Capacity equal to the going count MUST succeed.

#### Scenario: Capacity below going count rejected

- **WHEN** a scheduled match has capacity 3 and 2 members are `going`
- **AND** an organizer PATCHes capacity to 1
- **THEN** the response is HTTP 409 with code `CAPACITY_BELOW_RSVPS`
- **AND** stored capacity remains 3

#### Scenario: Capacity equal to going count allowed

- **WHEN** a scheduled match has capacity 3 and 2 members are `going`
- **AND** an organizer PATCHes capacity to 2
- **THEN** the response is HTTP 200
- **AND** stored capacity is 2

### Requirement: Partial match edit preserves omitted fields

`PATCH /api/v1/matches/:id` MUST apply only keys present in the JSON body. An omitted nullable field such as `description` MUST remain unchanged. An explicit empty string or JSON `null` for `description` MUST clear the stored value.

#### Scenario: Omitted description is kept

- **WHEN** a scheduled match has a non-empty description
- **AND** an organizer PATCHes only `venue`
- **THEN** the response is HTTP 200
- **AND** stored description is unchanged
- **AND** stored venue is the new value

#### Scenario: Empty description clears the field

- **WHEN** a scheduled match has a non-empty description
- **AND** an organizer PATCHes `description` as an empty string
- **THEN** the response is HTTP 200
- **AND** stored description is null

### Requirement: Notify members when schedule or venue changes

When an organizer updates a scheduled match and the stored start time, end time, or venue actually changes, the system MUST notify each member whose RSVP status is `going` or `waitlisted`. A PATCH that does not change those fields MUST NOT emit schedule-update notifications.

#### Scenario: Start time change notifies going and waitlisted

- **WHEN** a match has one `going` member and one `waitlisted` member
- **AND** an organizer PATCHes a new `startAt`
- **THEN** each of those members receives one `match_updated` notification
- **AND** the mailer is invoked once per those members with the `match_updated` template

#### Scenario: Description-only edit emits none

- **WHEN** an organizer PATCHes only `description` on a match that has going or waitlisted members
- **THEN** no `match_updated` notification is created
- **AND** the mailer is not invoked with `match_updated`

### Requirement: Unmark no-show

Organizers SHALL unmark a no-show via `DELETE /api/v1/matches/:id/no-shows/:userId`. The system MUST delete the `no_shows` row for that match and user and recompute `group_memberships.no_show_count` for that user in the match’s group. Non-organizers MUST receive forbidden.

#### Scenario: Organizer unmarks no-show

- **WHEN** an organizer has marked a going player as no-show
- **AND** the organizer DELETEs `/api/v1/matches/:id/no-shows/:userId`
- **THEN** the response is HTTP 204
- **AND** that membership `no_show_count` is 0 when no other no-shows remain

#### Scenario: Player cannot unmark

- **WHEN** a non-organizer member DELETEs `/api/v1/matches/:id/no-shows/:userId`
- **THEN** the system responds with forbidden
