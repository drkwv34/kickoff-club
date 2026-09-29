# Design — add-match-series

## Recurrence model

`rrule_json` stores `{ freq: "weekly", interval: 1-4, byWeekday: ["MO",...], count?: number, until?: "YYYY-MM-DD" }`. Weekdays use iCal-style `MO`–`SU`. The anchor instant is the request `startAt` / `endAt`; duration is preserved for every instance. Expansion is a pure function in `domain/recurrence.ts`.

## Expansion algorithm

1. Validate `startAt` weekday (in match timezone) is included in `byWeekday`.
2. Walk ISO weeks from the anchor week, stepping `interval` weeks at a time.
3. For each selected weekday, build wall-clock start/end via existing `instantFromWallClockInZone`.
4. Skip instants before `startAt`; stop on `count` or when local date exceeds `until`.
5. If result length is 0 or > 52, reject with validation error.

DST: wall-clock helpers keep local hour stable across occurrences (same approach as one-off creation).

## Transactions

`createMatchSeries` runs in one DB transaction: insert `match_series`, bulk insert `matches` with shared `series_id`. Composition exposes `runInTransaction` on matches deps (mirrors groups).

## Cancel policy (v1)

| Action | Endpoint | Effect |
|--------|----------|--------|
| Cancel one instance | `POST /api/v1/matches/:id/cancel` | That match only |
| Cancel entire series | `POST /api/v1/series/:id/cancel` | All `scheduled` matches with that `series_id` |
| This and future | — | Out of scope (Should in SRS) |

No series-level status column; cancelled series is implied when all instances are cancelled.

## API shapes

- `POST /api/v1/groups/:groupId/series` → `{ series, matches }` (201)
- `POST /api/v1/series/:seriesId/cancel` → `{ seriesId, cancelledCount, matches }` (200)

## Out of scope

ICS feeds, infinite RRULE, RSVP/waitlist, edit-this-and-future.
