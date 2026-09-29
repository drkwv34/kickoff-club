# Proposal

## Why

Organizers need repeating pickup sessions (e.g. every Tuesday and Thursday) without manual duplication. Day 5 delivered one-off matches; Day 6 adds bounded weekly recurrence materialized up front per FR-MATCH-002.

## What Changes

- Add `match_series` table with `rrule_json` (weekly, interval, byWeekday, count or until).
- Pure domain expansion (max 52 instances); transactional insert of series + all match rows.
- APIs: create series on a group; cancel entire series (all scheduled instances).
- Reuse existing single-match cancel for one instance.
- Minimal UI to create a weekly series from the group match area.
- Document v1 cancel policy: single instance via existing cancel; entire series via new endpoint; no “this and future”.

## Capabilities

### New Capabilities

<!-- none — extends matches -->

### Modified Capabilities

- `matches`: recurring series creation, expansion limits, series cancel, persistence link via `series_id`.

## Impact

- `src/modules/matches/` domain, infra, validation, composition.
- New Drizzle migration + `match_series` schema; FK from `matches.series_id`.
- REST: `POST /api/v1/groups/:id/series`, `POST /api/v1/series/:id/cancel`.
- UI: series create form/page.
- Vitest unit tests (recurrence) + integration (create series → N matches).
