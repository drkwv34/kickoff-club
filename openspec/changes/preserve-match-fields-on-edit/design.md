# Design

## Context

See proposal.md for motivation. `updateMatchBodySchema` reuses `matchFields.description`, which is `z.string().trim().max(2000).optional().transform(empty → null)`. Zod still invokes `transform` when the key is absent, so `undefined` becomes `null`. The route already spreads description only when `!== undefined`, which is true for `null`. Create-match should keep empty → null because a new row needs an explicit stored value.

## Goals / Non-Goals

**Goals:**

- Keep omitted update keys out of the parsed object (`undefined`).
- Map explicit `""` (after trim) and JSON `null` to `null` so clearing remains possible.
- Cover schema behavior with a unit test independent of HTTP.

**Non-Goals:**

- Changing create-match description handling.
- PATCH merge semantics for non-nullable fields (title/venue still require non-empty strings when present).
- JSON Merge Patch RFC 7396 beyond this field.

## Decisions

1. **Separate update description schema.** Do not share the create transform. Update uses `.nullish()` (or `string | null` union + optional) and a transform that returns `undefined` when the input was omitted.

2. **Create stays as-is.** `createMatchBodySchema` continues to coerce missing/empty description to `null` for insert.

3. **Domain mapper unchanged.** `updateMatch` already writes description only when `input.description !== undefined`.

## Risks / Trade-offs

- [Clients that omit the key vs send null] → Documented by scenarios; unit test both `safeParse({ venue })` and `safeParse({ description: "" })`.
- [Whitespace-only description] → Trim then treat as empty → null, same as create.

## Migration Plan

Code-only. No schema migration.

## Open Questions

(none)
