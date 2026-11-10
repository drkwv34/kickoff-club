# Spec Delta

## ADDED Requirements

### Requirement: Group management e2e covers roles, leave, edit, and no-show counts

The system SHALL provide a Playwright test against a running app and database in which an organizer promotes a player, demotes them, and edits a match, a player leaves the group, and the members list shows no-show counts.

#### Scenario: Organizer manages members and match, player leaves

- **WHEN** an organizer and a player share a group with a scheduled match
- **AND** the organizer promotes the player, demotes the player, and edits the match
- **AND** the player leaves the group
- **THEN** the members list shows no-show counts
- **AND** the edited match details are visible
- **AND** the player is no longer listed as a member
