# Tasks

## 1. Schema and migration

- [ ] Add Drizzle schema for `notifications`, `no_shows`, and `notification_type` enum
- [ ] Add forward-only migration SQL

## 2. Notifications module

- [ ] Domain ports, types, messages, create/list/mark-read use cases
- [ ] Drizzle notification repository
- [ ] SMTP `NotificationMailer` adapter (nodemailer)
- [ ] `composition.ts` and exports

## 3. No-show

- [ ] Domain `markNoShow` use case and infra repos
- [ ] `POST /api/v1/matches/[matchId]/no-shows` route with CSRF/session

## 4. Event wiring

- [ ] Waitlist promotion → notification + email after TX
- [ ] RSVP going confirmation, accept invite, cancel match → notification rows (email where applicable)

## 5. API and UI

- [ ] `GET /api/v1/notifications`, `POST /api/v1/notifications/read`
- [ ] Header bell + `/app/notifications` list page
- [ ] Organizer no-show control on match detail

## 6. Tests and validation

- [ ] Unit tests (no-show authz rules, notification helpers)
- [ ] Integration tests (promote→notification, no-show API)
- [ ] `openspec validate add-notifications-noshow --strict`
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`
