# Tasks

## 1. Regression coverage

- [x] 1.1 Add an integration test: organizer `POST /api/v1/groups/:id/invites` with `{ "maxUses": 5, "email": "<addr>" }` returns 201 and the recording mailer has exactly one message to that address containing the invite code or accept link; a following invite without `email` adds no message. Confirm it fails before the send is wired.

## 2. Mailer send

- [x] 2.1 Replace `stubInviteEmail` with a helper that sends `invite_received` through `getNotificationsDeps().mailer`, including group name, code, and accept URL. Update the SMTP template so the body includes the code or link. Verify the 1.1 test fails until the route calls the helper.
- [x] 2.2 Call the helper from `POST /api/v1/groups/:id/invites` after a successful create when `email` is present, swallow mailer errors, add an optional email field on the invite form, and verify 1.1 passes and existing max-uses / GONE tests still pass.

## 3. Validation

- [x] 3.1 Run `openspec validate send-invite-emails --strict` and confirm it exits 0.
