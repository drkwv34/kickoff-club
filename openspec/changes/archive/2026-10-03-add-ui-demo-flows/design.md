# Design

## Context

Existing UI routes under `src/app/` already call domain use-cases server-side and client forms post to `/api/v1`. Styling uses `globals.css` tokens. Day 10 is presentation-only within the ui layer.

## Goals / Non-Goals

**Goals:**

- Coherent demo path: `/` → auth → `/app` → group → match → RSVP.
- Reusable empty-state panel styling and role-aware copy.
- Form a11y improvements without new dependencies.

**Non-Goals:**

- API changes, Playwright, design-system rewrite, dark-mode expansion.

## Decisions

1. **Landing as server component** — Keep `page.tsx` async with `getServerSession()`; add semantic sections (`header`, `section`) and static feature list. No client animation libraries.
2. **Empty state component** — Add a small `EmptyState` presentational component (`role="status"`) used on dashboard, group, and notifications list for consistency.
3. **Organizer panels** — Wrap organizer-only blocks in `<section aria-labelledby="...">` with headings; players get alternate empty copy only.
4. **A11y helpers** — Use `aria-describedby` IDs `${fieldId}-hint` / `${fieldId}-error` in shared form patterns; fix duplicate `datalist` IDs on pages that render multiple timezone pickers.
5. **RSVP panel** — Add `.rsvp-panel` styles in `globals.css` matching `.panel` surface treatment.

## Risks / Trade-offs

- [Marketing copy drift from SRS] → Keep copy aligned with existing lede text on home page.
- [Over-scoping polish] → Limit CSS changes to empty states, landing layout, RSVP panel.

## Migration Plan

Deploy with app release; no data migration. Rollback is revert UI commits only.
