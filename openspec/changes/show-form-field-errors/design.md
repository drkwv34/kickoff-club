# Design

## Context

See proposal.md for motivation. `CreateSeriesForm` calls `setFieldErrors(body.fields ?? {})` but binds state as `const [, setFieldErrors]`, so nothing is rendered. Create-match, auth, group, settings, and password forms already render `fieldErrors` with `aria-describedby`. Domain must not import `react`.

## Goals / Non-Goals

**Goals:**

- Keep `fieldErrors` on the series form and render messages with `aria-describedby`.
- Map nested keys such as `recurrence.byWeekday` onto the weekday fieldset.
- Component test that a mocked 400 with `fields` shows a message under each named input.

**Non-Goals:**

- Changing API validation or error envelope shape.
- Client-side schema duplication of Zod.

## Decisions

1. **Keep local `fieldErrors` state; render a `<p className="field-error" role="alert">` per key.** Matches existing forms. Alternative: a shared FieldError helper — optional later; series is the gap.

2. **Map nested `fields` keys to controls.** `title`/`venue`/`capacity`/`timezone`/`description` bind to those inputs. `startAt`/`endAt` bind to date/time. `recurrence.byWeekday` describes the weekday fieldset. Unknown keys stay in the form-level alert only if there is no matching control.

3. **Component test in Vitest + jsdom.** Mock `fetch` for CSRF then POST. Do not add a browser e2e for this path; a real-app screenshot of series 400 is captured separately for the PR.

4. **Extend Vitest include to `*.test.tsx` and set `// @vitest-environment jsdom` on the component test.** Default environment stays node for integration tests.

## Risks / Trade-offs

- [Empty weekday 400 uses `recurrence.byWeekday`] → map that key to the fieldset `aria-describedby`.
- [jsdom dependency] → add `jsdom` as a devDependency used only by the component test.

## Migration Plan

No schema change. Rollback is revert of form rendering and the component test.

## Open Questions

(none)
