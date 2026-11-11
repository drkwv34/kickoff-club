# Spec Delta

## ADDED Requirements

### Requirement: CI smokes the production Compose image

GitHub Actions SHALL include a job that builds the repository Dockerfile and smoke-tests `GET /api/ready` against the running production app container with Postgres available. The job MUST NOT replace the existing quality gates.

#### Scenario: Production image ready check

- **WHEN** a pull request targets `main`
- **THEN** CI builds the app image
- **AND** a request to `/api/ready` on the running container succeeds
