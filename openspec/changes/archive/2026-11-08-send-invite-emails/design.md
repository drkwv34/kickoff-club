# Design

## Context

See proposal.md for motivation. `POST /api/v1/groups/:id/invites` already accepts optional `email` and calls `stubInviteEmail`, which no-ops. Promotion and cancellation send mail through `getNotificationsDeps().mailer` (`createSmtpNotificationMailer`, Mailpit in Compose) with `setNotificationsMailerForTests` as the integration seam. Domain modules must not import `next/*`. Invite accept and `maxUses` exhaustion already work.

## Goals / Non-Goals

**Goals:**

- Send one invite email when `email` is present, using the same mailer adapter as match notifications.
- Keep invite creation successful if SMTP fails.
- Cover the path with a recording-mailer integration test.

**Non-Goals:**

- In-app `invite_received` rows for addresses that are not users.
- Changing invite TTL, max-uses, or accept semantics.
- A dedicated ESP or queued outbox.

## Decisions

1. **Reuse `NotificationMailer` from the route after `createInvite` commits.** Pass `invite_received` with `groupName`, `code`, `acceptPath`, and `acceptUrl` (`APP_BASE_URL` + accept path). Replace `stubInviteEmail` with a helper that calls `mailer.send`. Alternative: publish an in-app notification — rejected because the recipient may not have an account.

2. **Try/catch around send.** Match FR-NOTIF-002: email failure does not undo the invite row.

3. **Template copy includes code and link.** Update `invite_received` subject/body in the SMTP adapter so Mailpit and tests can assert on payload or text.

4. **Optional email input on the invite form.** The API already accepts `email`; the form posts it when filled so organizers can trigger the send from the UI.

## Risks / Trade-offs

- [Mailer test seam shared with notifications] → Reset `setNotificationsMailerForTests(null)` in `afterEach`.
- [SMTP down] → Invite still 201; log at warn if useful, do not fail the request.
- [Group name vs id] → Look up the group name for the template; do not put the UUID in the subject.

## Migration Plan

No schema change. Deploy with the existing mailer env (`SMTP_HOST` / `SMTP_PORT`). Rollback is revert of the route helper.

## Open Questions

(none)
