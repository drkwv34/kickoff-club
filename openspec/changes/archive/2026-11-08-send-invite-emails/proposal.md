# Proposal

## Why

Organizers can already create invite codes, but `stubInviteEmail` is a no-op, so providing an email on `POST /api/v1/groups/:id/invites` never delivers the code or accept link. Invitees only join if someone copies the link by hand.

## What Changes

- Replace the invite-email no-op with a send through the existing notification SMTP adapter (Mailpit in Compose).
- When the create-invite body includes `email`, send exactly one message to that address whose body contains the invite code or accept link.
- Creating an invite without `email` still returns 201 and does not send mail.
- Invite accept behavior is unchanged: a valid code still joins as player; a second use of `maxUses=1` still returns 410 `GONE`.
- Regression: organizer `POST /groups/:id/invites` with `{ "maxUses": 5, "email": "<addr>" }` → 201 and exactly one recording-mailer message to that address containing the code or link.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `groups`: Creating an invite with an email address MUST send one invite email that includes the code or accept link, using the existing mailer adapter.

## Impact

- `src/modules/groups/infra/invite-code.ts` and `POST /api/v1/groups/:id/invites`.
- Existing `NotificationMailer` / SMTP adapter (`invite_received` template includes code and accept URL).
- Optional email field on the group invite form.
- Integration test with the recording mailer; no production ESP change.
