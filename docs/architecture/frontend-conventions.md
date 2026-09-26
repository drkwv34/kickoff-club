# Frontend conventions

## Layout

- App shell: header with nav (auth-aware later), main content max-width ~`72rem`, consistent vertical rhythm.
- Marketing landing at `/`; authenticated app under `/app/...` (when built).

## Design tokens

- CSS variables in `src/app/globals.css` for color, spacing, radius, font stack.
- Prefer system font stack or one web font; avoid one-off hex values in components — use tokens.

## Accessibility

- Form inputs paired with `<label>` or `aria-label`
- Focus visible on interactive elements
- Primary actions keyboard reachable (RSVP button — NFR-A11Y)
- Run axe in Playwright on match detail (Day 11+)

## States

Every data view handles:

- **Loading** — skeleton or spinner, not blank screen
- **Empty** — explain next step (e.g. “No matches yet — organizers can create one”)
- **Error** — user-safe message + retry when applicable; log details server-side

## Time display

Show match times in **match timezone** with hint when viewer timezone differs (SRS FR-MATCH display rules).

## Language

Default UI copy **English** unless OpenSpec changes to Spanish-first.
