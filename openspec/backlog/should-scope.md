# Should-scope backlog (proposal-only)

This note records **Should**-priority SRS items that are **not** in the v0.1.0 pin. It is an OpenSpec backlog, not a change to implement.

**Do not implement any item here** without a new OpenSpec change (`openspec new change …`) that is reviewed and applied separately. Day 13 `add-pin-ready-closeout` records this list only.

Sources: archived change proposals under `openspec/changes/archive/` and module READMEs.

| ID / name | Summary | Recorded in |
|-----------|---------|-------------|
| FR-AUTH-004 | Password reset (email token flow). Auth is register/login/logout only. | `openspec/changes/archive/2026-09-26-auth-sessions/proposal.md` |
| FR-MATCH-006 | Match list filters and pagination. List is ordered by `start_at` with no query filters. | `openspec/changes/archive/2026-09-29-matches-one-off/proposal.md` |
| Series “this and future” cancel | Cancel one instance and entire series exist; cancel-this-and-future is out of v1. | `src/modules/matches/README.md`, `openspec/changes/archive/2026-09-29-add-match-series/design.md` |
| Full RRULE / ICS export | Weekly materialization only; no ICS, no full RRULE engine. | `src/modules/matches/README.md` |
| FR-NOTIF-003 | Notification preference toggles (per-user email/in-app). | `openspec/changes/archive/2026-10-02-add-notifications-noshow/proposal.md` |
| FR-NOSHOW-002 | Unmark a no-show. Organizers can mark after kickoff; no reverse API. | same archive proposal Non-goals |
| SMS / production ESP | Mailpit SMTP locally; no SMS, bounce handling, or hosted ESP. | same archive proposal; `README.md` Trade-offs |
| Richer demo seed | Seed covers organizer, player, group, upcoming match. RSVPs and invite links are not seeded (Playwright covers those paths). | `README.md` Trade-offs / `openspec/specs/demo-seed/spec.md` |
| Dedicated API service | Route Handlers in the Next.js monolith; split API is a future scale trade-off, not a v0.1 Must. | `README.md` Trade-offs |

Must-scope capabilities already specified under `openspec/specs/` (auth, groups, matches, rsvps, notifications, app-ui, e2e, demo-seed) remain the pin contract.
