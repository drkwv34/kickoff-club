# Proposal

## Why

`GET /api/v1/groups/:id/matches` returns every match ordered by `start_at` and ignores query filters. Members cannot list upcoming vs past, filter by status or date range, or page through results.

## What Changes

- Honor query filters on the group match list: upcoming/past, status, and inclusive start-time date range.
- Add cursor pagination with `nextCursor` (stable `start_at`, `id` order) so pages have no duplicates or gaps.
- Add filter controls and a load-more action on the group matches UI.
- Regression: filters return the correct subset; `nextCursor` pages without duplicates or gaps.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `matches`: List MUST apply when/status/date-range filters and return `nextCursor` for pagination.
- `app-ui`: Group detail MUST expose match list filter controls.

## Impact

- `listMatchesForGroup` and match repository list query.
- `GET /api/v1/groups/:id/matches` query parsing.
- Group detail matches section UI.
- Integration tests for filters and cursor paging.
