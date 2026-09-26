# App-specific conventions — kickoff-club

## Roles

- **Organizer** vs **Player** are **group-scoped**; same user may differ per group.
- Authz checks always include group membership, not just global user id.

## Sports & enums

Use SRS Appendix A enums in domain types: sports, RSVP statuses, match status, notification types.

## Timezones

- Store instants as `timestamptz`; store match `timezone` as IANA string.
- User profile has `default timezone` for display.
- Unit tests must include **America/Bogota** (no DST) and **America/New_York** (DST) fixtures.

## Invites

- Codes expire (default 7 days); max uses enforced in domain.
- Invalid/expired → 410/404 per FR; do not leak group existence to non-members.

## Waitlist

- Promotion **transactional**; earliest waitlisted wins.
- Document race strategy in README hard-edges when implemented.

## Notifications

- In-app feed per user; email via adapter for key events (invite, promote, cancel).
- Dev: capture in Mailpit UI (http://localhost:8025).

## API versioning

All product JSON under `/api/v1`. Breaking changes require new version or OpenSpec migration plan.

## Sessions

Postgres-backed sessions preferred (SRS); HttpOnly cookies; CSRF on mutating cookie-auth requests (Day 3+).
