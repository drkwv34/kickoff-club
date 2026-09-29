# matches module

One-off matches and recurring series (FR-MATCH). Timezone-aware scheduling lives in domain layer.

## Recurring series (FR-MATCH-002)

- Weekly recurrence only: `interval` 1–4, `byWeekday` (`MO`–`SU`), end via `count` (1–52) or `until` (local date in match TZ).
- Instances are materialized up front (max 52). `match_series.rrule_json` stores the rule; each match has `series_id`.

### Cancel policy (v1)

| Action | API | Effect |
|--------|-----|--------|
| Cancel one instance | `POST /api/v1/matches/:id/cancel` | That match only |
| Cancel entire series | `POST /api/v1/series/:id/cancel` | All `scheduled` matches in the series |
| This and future | — | Not in v1 (SRS Should) |

No ICS export or full RRULE engine.
