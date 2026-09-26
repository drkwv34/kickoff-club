# Domain modeling

## Entities & aggregates

- **User**, **Group**, **Match**, **RSVP** are core aggregates (see SRS §6).
- **Group** aggregate: membership roles, invite codes, last-organizer invariant.
- **Match** aggregate: capacity, RSVPs, waitlist ordering; promotion rules stay inside `rsvps` use-cases referencing match id.

## Value objects

- Email (normalized lower case)
- IANA timezone string (validated against allowlist or `Intl` fallback)
- Sport enum, RSVP status enum, role enum — single source in domain types

## Invariants (examples)

- At most `capacity` RSVPs with status `going` per match (transactional enforcement).
- Cannot demote the last organizer in a group.
- Waitlist positions contiguous after promotion.
- Match `start_at` / `end_at` in stored `timestamptz`; display uses match timezone + user preference.

## Purity

Domain modules:

- No `react`, `next/*`, or HTTP types
- No direct `fs` or env reads — inject config/ports

## Use-cases

Named functions: `registerUser`, `promoteWaitlist`, `createMatch`, etc. Input DTOs validated with Zod at api boundary; domain assumes invariants on typed inputs.
