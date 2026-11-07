# Proposal

## Why

A partial `PATCH /api/v1/matches/:id` that omits `description` still clears it. The update Zod schema treats a missing key like an empty string (`optional().transform(empty→null)`), so the mapper writes `null` and organizers lose copy they did not intend to change.

## What Changes

- Update-match validation distinguishes omitted keys from explicit `""` or `null`.
- Only fields present in the JSON body are applied; omitted `description` is left unchanged.
- Sending `description: ""` or `description: null` still clears the field.
- Regression: PATCH only `venue` keeps `description`; PATCH `description: ""` clears it; unit test the schema.

## Capabilities

### New Capabilities

<!-- none — extends matches -->

### Modified Capabilities

- `matches`: Partial match edits MUST preserve omitted nullable fields and MUST clear a field only when the body sets it to empty or null.

## Impact

- `src/modules/matches/validation.ts` (`updateMatchBodySchema`).
- Route mapper in `src/app/api/v1/matches/[matchId]/route.ts` (already skips `undefined`).
- Unit tests for the schema plus HTTP integration coverage.
