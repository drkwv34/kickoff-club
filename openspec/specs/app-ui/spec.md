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
