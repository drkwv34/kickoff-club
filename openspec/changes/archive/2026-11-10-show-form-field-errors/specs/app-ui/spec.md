# Spec Delta

## ADDED Requirements

### Requirement: API field errors render under inputs

When a mutating form receives HTTP 400 with a `fields` map, the UI SHALL show each message under the matching input (or fieldset) and SHALL associate that message with the control using `aria-describedby`. The create-series form MUST keep and display `fields` instead of discarding them.

#### Scenario: Series form shows field errors from a 400

- **WHEN** the create-series form receives HTTP 400 with `fields` for one or more inputs
- **THEN** a message is shown under each matching input
- **AND** each of those inputs is described by its error via `aria-describedby`
