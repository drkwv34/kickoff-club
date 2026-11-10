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

### Requirement: Match list filter controls

The group detail matches section SHALL provide controls to filter by upcoming/past, status, and date range, and SHALL load additional pages when `nextCursor` is present.

#### Scenario: Member filters the match list

- **WHEN** a group member opens the group detail page
- **THEN** match list filter controls are visible
- **AND** submitting them updates the listed matches

### Requirement: Group members list management

The group detail members list SHALL show each member’s display name, role, and no-show count. Organizers SHALL have promote and demote controls for other members. Every member SHALL have a leave control for themselves. A `409 LAST_ORGANIZER` response MUST be shown as visible error text.

#### Scenario: Organizer promotes and demotes a player

- **WHEN** an organizer views a group that includes a player
- **THEN** the members list shows that player’s role and no-show count
- **AND** the organizer can promote the player to organizer and demote them back to player

#### Scenario: Last organizer leave is rejected in the UI

- **WHEN** the sole organizer submits leave group
- **THEN** the members list remains and the UI shows the last-organizer error

#### Scenario: Player leaves the group

- **WHEN** a player submits leave group
- **THEN** they leave the group and are no longer listed as a member

### Requirement: Edit match form

Organizers SHALL have an edit match form for a scheduled match that submits through `PATCH /api/v1/matches/:id`. Each input MUST have a visible label.

#### Scenario: Organizer edits a scheduled match

- **WHEN** an organizer opens a scheduled match
- **THEN** an edit match form is available
- **AND** submitting a valid change updates the match details shown on the page

### Requirement: API field errors render under inputs

When a mutating form receives HTTP 400 with a `fields` map, the UI SHALL show each message under the matching input (or fieldset) and SHALL associate that message with the control using `aria-describedby`. The create-series form MUST keep and display `fields` instead of discarding them.

#### Scenario: Series form shows field errors from a 400

- **WHEN** the create-series form receives HTTP 400 with `fields` for one or more inputs
- **THEN** a message is shown under each matching input
- **AND** each of those inputs is described by its error via `aria-describedby`

### Requirement: Header fits narrow viewports

The primary header navigation SHALL wrap or collapse at viewports 390px wide and below so the document does not overflow horizontally. Controls remain reachable without horizontal scrolling.

#### Scenario: Signed-in header at 390 by 844

- **WHEN** a signed-in user opens the app at a 390×844 viewport
- **THEN** `document.documentElement.scrollWidth` is less than or equal to `clientWidth`

#### Scenario: Signed-in header at 375 width

- **WHEN** a signed-in user opens the app at a 375px-wide viewport
- **THEN** `document.documentElement.scrollWidth` is less than or equal to `clientWidth`
