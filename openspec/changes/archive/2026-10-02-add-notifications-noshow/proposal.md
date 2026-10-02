# Proposal

## Why

Day 8 delivered waitlist promotion but players still lack visibility when they are promoted, invited, or when organizers need accountability for absences. Day 9 closes FR-NOSHOW-001 and FR-NOTIF-* so organizers can mark no-shows after kickoff and members receive in-app (and dev email) signals for key match events.

## What Changes

- Organizer-only `POST /api/v1/matches/:id/no-shows` after `start_at`; increments `group_memberships.no_show_count`; persists `no_shows` audit row.
- `notifications` table plus `GET /api/v1/notifications` and `POST /api/v1/notifications/read`.
- `NotificationMailer` adapter with Mailpit SMTP in Compose; promotion (and other listed events) create notification rows and attempt email send.
- Minimal UI: notifications bell/list with unread count; organizer no-show control on match detail when eligible.
- Integration/unit tests for authz, promote→notification, and mail adapter wiring.

## Capabilities

### New Capabilities

- `notifications`: In-app notification persistence, read APIs, email adapter contract, and event types for invite, RSVP confirmed, waitlist promoted, match cancelled, no-show marked.

### Modified Capabilities

- `matches`: No-show marking API and organizer authorization after match start.
- `rsvps`: Waitlist promotion SHALL emit a notification (and email attempt) for the promoted user within the promotion transaction boundary where practical.

## Impact

- Drizzle schema + migration (`notifications`, `no_shows`)
- `src/modules/notifications/` (domain, infra, composition)
- `src/modules/matches/` (mark no-show use case)
- `src/modules/rsvps/` (hook promotion to notifications)
- API routes under `/api/v1/notifications` and `/api/v1/matches/:id/no-shows`
- UI header bell + notifications page; match detail no-show UI for organizers
- `nodemailer` (or lightweight SMTP client) dependency; `.env.example` unchanged pattern

## Non-goals

- SMS, production ESP, notification preference toggles (FR-NOTIF-003), unmark no-show (FR-NOSHOW-002), Day 10 polish, new Playwright e2e suite.
