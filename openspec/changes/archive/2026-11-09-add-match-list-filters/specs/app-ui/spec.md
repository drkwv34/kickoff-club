# Spec Delta

## ADDED Requirements

### Requirement: Match list filter controls

The group detail matches section SHALL provide controls to filter by upcoming/past, status, and date range, and SHALL load additional pages when `nextCursor` is present.

#### Scenario: Member filters the match list

- **WHEN** a group member opens the group detail page
- **THEN** match list filter controls are visible
- **AND** submitting them updates the listed matches
