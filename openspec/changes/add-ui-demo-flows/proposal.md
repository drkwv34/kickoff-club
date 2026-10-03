# Proposal

## Why

Days 1–9 delivered APIs and functional UI fragments, but the product does not yet read as a coherent demo: landing is bare, empty states and organizer vs player affordances are inconsistent, and primary forms need baseline accessibility. Day 10 makes the happy path demonstrable in Compose without API tools.

## What Changes

- Marketing-style landing at `/` with clear value proposition and CTAs (not an animation showcase).
- Polished empty states and role-aware copy on dashboard, group detail, and match RSVP views.
- Organizer-only actions visually grouped; players see read-only guidance where they cannot act.
- Accessibility on primary forms: explicit labels, `aria-describedby` for hints/errors, visible focus (existing tokens).
- Small UX fixes found while dogfooding (navigation breadcrumbs, duplicate datalist IDs, RSVP panel styling).

## Capabilities

### New Capabilities

- `app-ui`: Public landing and authenticated app shell UX — demo flow, empty states, role-aware views, and form accessibility requirements.

### Modified Capabilities

- _(none — no API or domain behavior changes)_

## Impact

- `src/app/page.tsx`, `src/app/app/**`, `src/app/_components/**`
- `src/app/globals.css` (layout/empty-state/panel tokens only)
- No new API routes, migrations, or domain modules

## Non-goals

- Design-system rewrite, dark-mode overhaul, native mobile app, Playwright e2e (Day 11).
