# app-ui Specification

## Purpose
Defines user-facing web UI behavior for the public landing page and authenticated app flows so a new user can complete register → group → match → RSVP without API tools.

## Requirements

### Requirement: Public landing explains product and entry points

The system SHALL serve a marketing landing page at `/` that describes pickup-match organization (groups, RSVPs, waitlists) and provides primary calls to action to register or sign in. Signed-in visitors SHALL see a link to the authenticated app dashboard.

#### Scenario: Anonymous visitor sees CTAs

- **WHEN** an unauthenticated user opens `/`
- **THEN** the page shows product summary copy and visible Register and Sign in actions

#### Scenario: Signed-in visitor reaches app

- **WHEN** an authenticated user opens `/`
- **THEN** the page shows who is signed in and a link to `/app`

### Requirement: Dashboard empty state guides next steps

When a signed-in user has no group memberships, the dashboard SHALL show an empty state that explains creating a group or joining with an invite code, with both flows reachable on the same page.

#### Scenario: No groups yet

- **WHEN** the user opens `/app` with zero groups
- **THEN** an empty-state message is shown above the join-invite and create-group forms

### Requirement: Group detail reflects organizer vs player role

On a group detail page, organizers SHALL see controls to create matches and manage invites. Players SHALL NOT see organizer-only controls and SHALL see guidance when no matches exist.

#### Scenario: Organizer sees match creation

- **WHEN** an organizer views a group they organize
- **THEN** create match and create series actions are visible

#### Scenario: Player sees read-only empty matches

- **WHEN** a non-organizer member views a group with no matches
- **THEN** an empty-state message explains that organizers schedule matches and no create-match controls are shown

### Requirement: Match detail supports RSVP happy path

On an open scheduled match, members SHALL see RSVP status, capacity, and Going / Decline actions with keyboard-focusable controls.

#### Scenario: RSVP before start

- **WHEN** a member views a scheduled match that has not started
- **THEN** RSVP actions are enabled and labeled with visible focus styles

### Requirement: Primary forms meet baseline accessibility

Registration, login, create-group, create-match, and join-invite forms SHALL pair each input with a visible label (or `aria-label`) and associate inline hints or field errors via `aria-describedby` where shown.

#### Scenario: Field error is announced

- **WHEN** a form displays a field-level validation error
- **THEN** the error text is linked to the input with `aria-describedby` and marked as an alert where appropriate

### Requirement: Settings profile form

Signed-in users SHALL have a settings page with a form to change display name and timezone. Each input MUST have a visible label. Submitting valid values MUST persist them through `PATCH /api/v1/me`.

#### Scenario: Signed-in user opens settings

- **WHEN** an authenticated user opens `/app/settings`
- **THEN** the page shows labeled display name and timezone fields
- **AND** a primary navigation link to settings is available

### Requirement: Forgot and reset password pages

The UI SHALL provide `/forgot-password` to request a reset email and `/reset-password` to set a new password from a token. `/login` MUST include a visible "forgot password" link to `/forgot-password`. Forms MUST pair each input with a visible label.

#### Scenario: Login links to forgot password

- **WHEN** an unauthenticated user opens `/login`
- **THEN** the page includes a link to `/forgot-password`

#### Scenario: Forgot-password form

- **WHEN** a user opens `/forgot-password`
- **THEN** the page shows a labeled email field and a submit control

#### Scenario: Reset-password form

- **WHEN** a user opens `/reset-password`
- **THEN** the page shows a labeled new-password field and a submit control

### Requirement: Notification preference toggles

The notifications page SHALL show labeled in-app and email toggles for each supported notification type. Changing a toggle MUST persist through `PATCH /api/v1/me/notification-preferences`.

#### Scenario: Signed-in user sees preference toggles

- **WHEN** an authenticated user opens `/app/notifications`
- **THEN** the page shows in-app and email controls for each notification type

### Requirement: Unmark no-show control

When an organizer views a match that has started and a player is marked no-show, the UI SHALL provide a control to unmark that player.

#### Scenario: Organizer sees unmark button

- **WHEN** an organizer opens a started match with a marked no-show
- **THEN** an unmark control is visible for that player
