# Design

## Context

Vitest integration tests already run against Postgres in CI. Playwright config is a stub; Next.js UI flows exist for auth, groups, invites, matches, RSVP, and organizer no-show. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**

- One primary e2e spec for waitlist promotion with two browser contexts (organizer + player).
- No-show flow in the same spec using the Playwright `request` API (organizer session) to create a match whose `startAt` is in the past, after seeding a going RSVP via API while the match was still open (create future match, RSVP in UI, then API-only reschedule is not available — so: create match via API with startAt one hour ago and insert going RSVP via API in test helper, then organizer marks no-show in UI).

- `webServer`: `pnpm exec next start` after CI/build; local e2e runs `next build` then start via webServer command.
- CI: add `pnpm build` and `pnpm exec playwright test` after browser install.

**Non-goals:**

- Mailpit service in CI.
- Visual snapshots or multi-browser matrix.

## Decisions

1. **webServer** — Playwright starts `next start` on port 3000 after `pnpm build` in the webServer command chain; reuse workflow `DATABASE_URL` / `SESSION_SECRET` / `APP_BASE_URL`.

2. **Two browser contexts** — Separate cookies per user; dialog handler for RSVP cancel confirm.

3. **Invite path** — Organizer creates invite; player registers and accepts on `/invite/:code`.

4. **Capacity 1** — Clear waitlist promotion signal.

5. **No-show** — Test helper uses authenticated `request` storage from organizer to `POST` match with `startAt`/`endAt` in the past and `POST` RSVP `going` for the target user (API allows organizer/member RSVP rules). UI assertion: organizer opens match page, selects player, submits Mark no-show, sees success message. Rationale: UI cannot RSVP after match start; past-dated create via form closes RSVP immediately.

## Risks / Trade-offs

- **[Risk] API helper for no-show setup** → Still validates organizer UI; waitlist path remains 100% UI.
- **[Risk] CI runtime** → Mitigate with single worker, chromium only, one spec file.
- **[Risk] CSRF on API helpers** → Reuse page context `request` after login so cookies + CSRF header from `/api/v1/csrf` pattern used by UI.

## Migration Plan

- Merge PR; CI on `main` gains Playwright gate. No production deploy change.
- Archive OpenSpec change after merge.
