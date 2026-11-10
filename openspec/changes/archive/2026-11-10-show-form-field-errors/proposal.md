# Proposal

## Why

Create-series stores `fields` from a 400 response but discards the value (`const [, setFieldErrors]`), so users only see “Invalid request”. Other forms already keep `fields`; series and any remaining gaps need the same per-input messages with `aria-describedby`.

## What Changes

- Keep and render `fields` from 400 responses on the series form.
- Show a message under each matching input, linked with `aria-describedby`.
- Apply the same pattern on other mutating forms that receive `fields`.
- Add a component regression: a 400 with `fields` shows a message under each input.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `app-ui`: Forms that submit to JSON APIs MUST render `fields` from 400 responses under the matching inputs with `aria-describedby`.

## Impact

- `src/app/_components/create-series-form.tsx` and other client forms that parse `fields`.
- Component test under `src/app/_components/__tests__/`.
- Possible Vitest jsdom environment for that test file.
