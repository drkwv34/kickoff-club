# Tasks

## 1. Regression coverage

- [ ] 1.1 Add a component test: create-series 400 with `fields` shows a message under each matching input with `aria-describedby`. Confirm it fails while series discards `fieldErrors`.

## 2. Render field errors

- [ ] 2.1 Keep `fieldErrors` on the series form, render per-field messages with `aria-describedby` (including nested recurrence keys), and align remaining mutating forms that parse `fields`. Verify 1.1 passes.

## 3. Validation

- [ ] 3.1 Run `openspec validate show-form-field-errors --strict` and confirm it exits 0.
