# Design

## Approach

- **Seed entrypoint**: `src/lib/db/seed.ts` (CLI, mirrors `migrate.ts`) calls `runDemoSeed()` in `src/lib/db/seed-demo.ts`.
- **Idempotency**: Stable demo emails and fixed UUIDs for group/match; users located by email on re-run; inserts use `onConflictDoNothing` where Drizzle supports it; memberships and match use fixed primary keys.
- **Credentials** (documented in README only, not secrets):
  - Organizer: `organizer@demo.kickoff.local` / `DemoKickoff12!`
  - Player: `player@demo.kickoff.local` / `DemoKickoff12!`
- **Match timing**: `startAt` = next Saturday 18:00 in `America/Bogota`, at least 3 days out; on re-run, if the demo match exists but `startAt` is in the past, bump to the same rule so the demo stays “upcoming”.
- **Password hashing**: Reuse `createArgon2PasswordHasher()` from auth infra (composition root pattern for scripts is acceptable at `src/lib/db` layer).

## Testing

- `seed-demo.test.ts`: migrate schema, run `runDemoSeed()` twice, assert exactly one organizer, one player, one demo group, one demo match; assert organizer membership role.
- CI: after `db:verify`, run `pnpm db:seed` twice (shell proof).

## README

- Replace placeholder footer; reorder sections per Day 12 brief.
- CI badge: GitHub Actions `quality` job on `main` for `drkwv34/kickoff-club`.
- Architecture: mermaid diagram aligned with `docs/architecture/README.md`.
- Hard edges: authz (last organizer), waitlist promotion (transactional), timezones (IANA per user/group/match).

## GitHub metadata

- Attempt `gh api` PATCH repo with description and topics; on 403, list intended blurb/topics in README “Repository” subsection.
