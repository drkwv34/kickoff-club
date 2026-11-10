# Spec Delta

## ADDED Requirements

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
