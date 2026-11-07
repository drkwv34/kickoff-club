# Spec Delta

## ADDED Requirements

### Requirement: Capacity floor on match edit

Organizers SHALL NOT lower match capacity below the count of RSVPs with status `going`. `PATCH /api/v1/matches/:id` with such a capacity MUST return HTTP 409 with code `CAPACITY_BELOW_RSVPS` and MUST leave stored capacity unchanged. Capacity equal to the going count MUST succeed.

#### Scenario: Capacity below going count rejected

- **WHEN** a scheduled match has capacity 3 and 2 members are `going`
- **AND** an organizer PATCHes capacity to 1
- **THEN** the response is HTTP 409 with code `CAPACITY_BELOW_RSVPS`
- **AND** stored capacity remains 3

#### Scenario: Capacity equal to going count allowed

- **WHEN** a scheduled match has capacity 3 and 2 members are `going`
- **AND** an organizer PATCHes capacity to 2
- **THEN** the response is HTTP 200
- **AND** stored capacity is 2
