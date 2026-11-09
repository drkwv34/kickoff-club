# Tasks

## 1. Regression coverage

- [ ] 1.1 Add an integration test: upcoming/past/status/date-range filters return the correct subset; `limit` + `nextCursor` pages without duplicates or gaps. Confirm it fails while the list ignores query params.

## 2. List query and UI

- [ ] 2.1 Parse list query params in the route, filter and cursor-paginate in domain/infra, and return `{ matches, nextCursor }`. Verify 1.1 passes and unfiltered lists still return every match.
- [ ] 2.2 Add filter controls and load-more on group detail, and verify the page shows those controls.

## 3. Validation

- [ ] 3.1 Run `openspec validate add-match-list-filters --strict` and confirm it exits 0.
