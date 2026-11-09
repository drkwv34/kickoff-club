# Spec Delta

## ADDED Requirements

### Requirement: Match list filters and cursor pagination

`GET /api/v1/groups/:id/matches` MUST filter by `when` (`upcoming` or `past` relative to now), `status` (`scheduled` or `cancelled`), and optional `from`/`to` instants on `start_at`. Results MUST stay ordered by `start_at` then `id`. When `limit` is provided the response MUST include `nextCursor` that pages the same filter without duplicates or gaps. Omitting filters MUST still return the matching list for the group.

#### Scenario: Upcoming filter excludes past matches

- **WHEN** a member lists matches with `when=upcoming`
- **THEN** every returned match has `start_at` greater than or equal to now
- **AND** past matches in the group are omitted

#### Scenario: Cursor pages without duplicates or gaps

- **WHEN** a member lists matches with `limit` smaller than the result set
- **THEN** the response includes `nextCursor`
- **AND** fetching the next page with that cursor returns later matches
- **AND** the combined pages have no duplicate ids and no missing matches from the unpaged filtered list
