# Design

## Context

See proposal.md for motivation. `publishNotification` always inserts an in-app row then attempts email. There is no preferences table or `/api/v1/me/notification-preferences` route. Mutating routes call `assertCsrf` then `requireSession`. Domain must not import `next/*`. Supported types live in `NOTIFICATION_TYPES` (includes `match_updated`).

## Goals / Non-Goals

**Goals:**

- Store per-type in-app/email flags with both-on defaults.
- GET/PATCH preferences with CSRF on PATCH.
- Dispatcher skips a channel when that flag is off.
- Toggles on the notifications page.

**Non-Goals:**

- Per-group or per-match overrides.
- SMS or a third channel.
- Changing password-reset or invite-code mail that is not published through `publishNotification`.

## Decisions

1. **One row per (user, type) with `in_app` and `email` booleans.** Unique primary key `(user_id, type)`. Alternative: JSON blob on users — rejected so each type can be updated independently and queried in the dispatcher.

2. **Absent row means both channels on.** GET materializes the full type list from `NOTIFICATION_TYPES`. PATCH upserts only the supplied types/channels.

3. **Dispatcher reads prefs before write/send.** If in-app is off, skip `notifications.create`. If email is off, skip `mailer.send`. Email failures still must not roll back an in-app row when in-app was written.

4. **Same CSRF as other PATCH routes.** Cookie `kickoff_csrf` + `X-CSRF-Token`. No new cookie.

5. **UI on `/app/notifications`.** Client form of checkboxes per type × channel, PATCHing after each change (or a Save control). Labels are visible.

## Risks / Trade-offs

- [Existing users have no rows] → defaults both on, matching current behavior.
- [Prefs race with publish] → last stored row wins; acceptable for v1 toggles.

## Migration Plan

Forward-only SQL creating `notification_preferences`. Rollback is revert of the migration, route, dispatcher, and UI.

## Open Questions

(none)
