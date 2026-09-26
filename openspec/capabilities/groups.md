# Capability: groups

**Status:** schema foundation (Day 2). RBAC/invites/UI: Day 4.  
**SRS:** FR-GRP-001..005.  
**OpenSpec:** [`changes/2026-09-26-groups-foundation`](../changes/2026-09-26-groups-foundation/).

## What exists now

- Tables `groups` and `group_memberships`.
- Enums `sport` (`futbol` \| `basketball` \| `volleyball` \| `tennis` \| `other`) and `membership_role` (`organizer` \| `player`).
- `LAST_ORGANIZER` domain code mapped to HTTP 409 (rule not enforced yet).

## What this capability will do

Named local clubs; creator is organizer; invite codes; promote/demote with last-organizer protection; leave-group rules.

## Explicitly not this capability (yet)

Invites table, HTTP group APIs, group UI, match/RSVP coupling.
