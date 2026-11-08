# Tasks

## 1. Regression coverage

- [x] 1.1 Add an integration test: authenticated PATCH `{ "timezone": "Europe/Madrid" }` to `/api/v1/me` returns 200 and a following GET reflects it; invalid timezone returns 400 with `fields.timezone`; missing CSRF returns 403. Confirm it fails while only GET is exported.

## 2. Endpoint and settings form

- [x] 2.1 Add `updateProfile` in auth domain, `users.update` in the repository, and PATCH on `/api/v1/me` with CSRF plus IANA-validated optional `displayName`/`timezone`. Verify 1.1 passes and registration timezone tests still pass.
- [x] 2.2 Add `/app/settings` with a labeled display-name and timezone form that PATCHes `/api/v1/me`, link it from the header, and verify the page renders for a signed-in user.

## 3. Validation

- [x] 3.1 Run `openspec validate add-profile-update-endpoint --strict` and confirm it exits 0.
