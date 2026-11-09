# Proposal

## Why

Notification delivery always writes an in-app row and attempts email. Members cannot mute a channel for a type, so a waitlist promotion always emails even when the user only wants the in-app copy.

## What Changes

- Persist per-user, per-type in-app and email toggles (default both on when no row exists).
- Add `GET` and `PATCH /api/v1/me/notification-preferences` with the same CSRF cookie and `X-CSRF-Token` header as other mutating `/api/v1` routes.
- Honor those toggles in the notification dispatcher, including `match_updated`.
- Show labeled in-app and email toggles on the notifications page.
- Regression: disable email for `waitlist_promoted` → promotion creates an in-app notification and does not send email.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `notifications`: Users MUST get and update per-type in-app/email preferences; the dispatcher MUST skip a channel when that toggle is off.
- `app-ui`: The notifications page MUST expose per-type in-app and email toggles.

## Impact

- Drizzle schema + migration for `notification_preferences`.
- Notifications domain/infra/composition and `publishNotification`.
- New route under `/api/v1/me/notification-preferences`.
- Notifications page UI.
- Integration test for waitlist promotion with email disabled.
