# Design

## Context

See proposal.md for motivation. `.site-header-inner` is a non-wrapping flex row; `.nav` is also nowrap with five signed-in items. Overflow is measured on `document.documentElement`.

## Goals / Non-Goals

**Goals:**

- Collapse the primary nav behind a Menu control at max-width 390px.
- Keep the inline nav at larger widths.
- E2e at 390×844 and 375 asserting no document horizontal overflow.

**Non-Goals:**

- Redesigning landing marketing layout.
- Changing header information architecture (same links).

## Decisions

1. **`<details class="nav-menu">` collapse at `max-width: 390px`.** Native disclosure, no extra JS. The inline `.nav-inline` hides at that breakpoint; the menu hides above it. Alternative: flex-wrap only — rejected because Sign out + four links still overflow a single 390px row with brand.

2. **Same link set in both presentations.** Dashboard, Notifications, Settings, display name, Sign out (or Sign in / Register when logged out).

3. **Measure `document.documentElement`**, matching the overflow report, not only the header element.

## Risks / Trade-offs

- [Two copies of nav links] → keep markup small; CSS shows one.
- [Open details still wide] → menu panel is a column, `max-width: 100%`, wrapping allowed.

## Migration Plan

CSS + header markup only. Rollback is revert.

## Open Questions

(none)
