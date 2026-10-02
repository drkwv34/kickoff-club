# Tasks

## 1. Schema and migration

- [x] Add Drizzle schema for `notifications`, `no_shows`, and `notification_type` enum
- [x] Add forward-only migration SQL

## 2. Notifications module

- [x] Domain ports, types, messages, create/list/mark-read use cases
- [x] Drizzle notification repository
- [x] SMTP `NotificationMailer` adapter (nodemailer)
- [x] `composition.ts` and exports

## 3. No-show

- [x] Domain `markNoShow` use case and infra repos
- [x] `POST /api/v1/matches/[matchId]/no-shows` route with CSRF/session

## 4. Event wiring

- [x] Waitlist promotion → notification + email after TX
- [x] RSVP going confirmation, accept invite, cancel match → notification rows (email where applicable)

## 5. API and UI

- [x] `GET /api/v1/notifications`, `POST /api/v1/notifications/read`
- [x] Header bell + `/app/notifications` list page
- [x] Organizer no-show control on match detail

## 6. Tests and validation

- [x] Unit tests (no-show authz rules, notification helpers)
- [x] Integration tests (promote→notification, no-show API)
- [x] `openspec validate add-notifications-noshow --strict`
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test`
