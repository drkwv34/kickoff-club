# Design

## Context

See proposal.md for motivation. `listMatchesForGroup` calls `matches.listByGroupId` with no query. The HTTP GET handler ignores `request.url` search params. UI on group detail renders the full array. Domain must not import `next/*`.

## Goals / Non-Goals

**Goals:**

- Parse `when`, `status`, `from`, `to`, `cursor`, `limit` on GET list.
- Stable cursor over (`start_at`, `id`).
- Filter controls + load more on group detail.

**Non-Goals:**

- Server-side full-text search.
- Changing create/edit/cancel APIs.
- Infinite scroll without an explicit control.

## Decisions

1. **Additive query params; unchanged path.** Keep `GET /api/v1/groups/:id/matches`. Alternative: a new `/matches:search` resource — rejected to stay on the existing list.

2. **Omit `limit` ⇒ return the full filtered set and `nextCursor: null`.** Existing clients and series tests keep working. UI passes `limit` (10) when paging.

3. **Cursor is opaque base64url `{ s, i }`.** Domain encodes/decodes. Invalid cursor is 400. Comparison is `(start_at, id) > cursor` in ascending order.

4. **`when=upcoming` means `start_at >= clock()`, `past` means `start_at < clock()`.** Combined with `from`/`to` using AND. `from`/`to` accept ISO instants or `YYYY-MM-DD` (UTC day bounds).

5. **UI is a GET form on group detail using searchParams**, plus a client load-more that appends via the JSON API.

## Risks / Trade-offs

- [Clock skew vs stored `start_at`] → use server `deps.clock()`.
- [Matches sharing the same `start_at`] → id tie-breaker prevents skipped rows.

## Migration Plan

No schema change. Rollback is revert of list query, route parsing, and UI.

## Open Questions

(none)
