# Spec Delta

## ADDED Requirements

### Requirement: Partial match edit preserves omitted fields

`PATCH /api/v1/matches/:id` MUST apply only keys present in the JSON body. An omitted nullable field such as `description` MUST remain unchanged. An explicit empty string or JSON `null` for `description` MUST clear the stored value.

#### Scenario: Omitted description is kept

- **WHEN** a scheduled match has a non-empty description
- **AND** an organizer PATCHes only `venue`
- **THEN** the response is HTTP 200
- **AND** stored description is unchanged
- **AND** stored venue is the new value

#### Scenario: Empty description clears the field

- **WHEN** a scheduled match has a non-empty description
- **AND** an organizer PATCHes `description` as an empty string
- **THEN** the response is HTTP 200
- **AND** stored description is null
