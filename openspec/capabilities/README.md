# Capabilities index (stub)

Normative product requirements live in the project SRS. This folder holds **stable, in-repo capability summaries** updated when OpenSpec changes merge.

| Capability | Status | Notes |
|------------|--------|-------|
| [`auth`](./auth.md) | implemented | Register / session cookies / CSRF (Day 3) |
| [`groups`](./groups.md) | implemented | Create/join, invites, last-organizer RBAC (Day 4) |
| `matches` | planned | One-off + series, timezones (FR-MATCH-*) |
| `rsvps` | planned | Capacity, waitlist, promotion (FR-RSVP-*) |
| `notifications` | planned | In-app + email adapter (FR-NOTIF-*) |
| `noshow` | planned | Organizer marking (FR-NOSHOW-*) |

Add one markdown file per capability when the first approved change implements it (e.g. `auth.md`).
