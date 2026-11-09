# Spec Delta

## ADDED Requirements

### Requirement: Notification preference toggles

The notifications page SHALL show labeled in-app and email toggles for each supported notification type. Changing a toggle MUST persist through `PATCH /api/v1/me/notification-preferences`.

#### Scenario: Signed-in user sees preference toggles

- **WHEN** an authenticated user opens `/app/notifications`
- **THEN** the page shows in-app and email controls for each notification type
