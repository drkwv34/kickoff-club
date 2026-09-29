# Spec Delta

## ADDED Requirements

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
