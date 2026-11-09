# Tasks

## 1. Regression coverage

- [ ] 1.1 Add an integration test: disable email for `waitlist_promoted`, promote a waitlisted player, assert an in-app `waitlist_promoted` notification exists and the recording mailer has no `waitlist_promoted` send. Confirm it fails before the dispatcher honors preferences.

## 2. Preferences table, APIs, dispatcher, and UI

- [ ] 2.1 Add `notification_preferences` (user, type, in-app, email; both-on defaults), GET/PATCH `/api/v1/me/notification-preferences` with CSRF on PATCH, and make `publishNotification` skip a channel when that toggle is off. Verify 1.1 passes and missing CSRF still returns 403.
- [ ] 2.2 Add labeled in-app and email toggles on `/app/notifications` that PATCH preferences, and verify the page shows those controls for a signed-in user.

## 3. Validation

- [ ] 3.1 Run `openspec validate add-notification-preferences --strict` and confirm it exits 0.
