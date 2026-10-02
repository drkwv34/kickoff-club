# Design

## Context

kickoff-club uses layered modules (`domain` → `infra`), Drizzle migrations, session + CSRF on mutating APIs, and Mailpit already in Compose. `group_memberships.no_show_count` exists; waitlist promotion runs inside RSVP transactions via `fillOpenSpotsFromWaitlist`.

## Goals / Non-Goals

**Goals:**

- Persist `notifications` and `no_shows` tables per SRS §6.
- Organizer no-show use case with domain errors mapped to HTTP.
- Notification creation service callable from RSVP promotion and other event sites.
- SMTP mailer via nodemailer to `SMTP_HOST`/`SMTP_PORT`.
- Minimal bell UI and organizer no-show control.

**Non-Goals:**

- Outbox table with retry worker (direct send after TX commit is acceptable for v1).
- FR-NOTIF-003 preferences, FR-NOSHOW-002 unmark, invite email beyond stub notification row.

## Decisions

1. **Promotion hook**: Extend `fillOpenSpotsFromWaitlist` to return promoted user ids per iteration; after transaction commits, call notification + mailer (avoids SMTP in DB TX per architecture docs).
2. **Notification module layout**: `src/modules/notifications/domain` (ports, create/list/mark-read), `infra` (Drizzle repo, `smtp-mailer.ts`), `composition.ts` singleton like other modules.
3. **No-show**: New `matches/domain/mark-no-show.ts`; repo methods on memberships + new `no_shows` repo in matches or shared infra.
4. **Email templates**: Simple text subjects per `NotificationType` enum; HTML optional plain text only for Mailpit demo.
5. **RSVP confirmed / invite / cancel**: Wire notification creation at existing API/use-case call sites (set-rsvp going, accept-invite, cancel-match) with minimal payload JSON.

## Risks / Trade-offs

- [Email send outside TX] → User may see in-app notification if SMTP fails; acceptable per spec.
- [Promotion loop multiple spots] → Notify once per promoted user in loop.

## Migration Plan

Forward-only SQL migration adding `notifications` and `no_shows` enums/tables; `pnpm db:migrate` in CI and Compose migrate service.

## Open Questions

(none)
