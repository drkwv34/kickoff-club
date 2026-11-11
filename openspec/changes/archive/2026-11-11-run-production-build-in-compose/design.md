# Design

## Context

See proposal.md for motivation. `next.config.ts` already sets `output: "standalone"`; Playwright starts that bundle via `scripts/start-standalone.mjs`. The Dockerfile still copies the tree and runs `pnpm dev`. `docker-compose.yml` uses the same image for `app` (default CMD) and `migrate` (`command: pnpm db:migrate`). README documents `docker compose exec app pnpm db:seed`.

## Goals / Non-Goals

**Goals:**

- Multi-stage image: install, `pnpm build`, runtime `pnpm start`.
- Keep `tsx` + `src/` + `drizzle/` in the runtime image so migrate and seed work.
- CI job independent of `quality` that builds Compose and curls `/api/ready`.

**Non-Goals:**

- Distroless/standalone-only runtime that drops `pnpm db:seed`.
- Changing Playwright's standalone starter.
- Multi-arch publishing.

## Decisions

1. **Runtime keeps full `node_modules` plus source needed for seed/migrate.** Alternative: copy only `.next/standalone` — rejected because seed/migrate need `tsx`, Drizzle SQL, and `src/lib/db`.

2. **Build-time env placeholders.** `next build` may load `instrumentation` / env schema. Dockerfile sets dummy `DATABASE_URL`, `SESSION_SECRET`, and `APP_BASE_URL` during the builder stage. Runtime Compose supplies the real values.

3. **Compose `NODE_ENV=production`.** `next start` is the production server; this also removes the Next.js dev badge. Secure cookies work on `http://localhost` in browsers.

4. **`.dockerignore`** excludes `node_modules`, `.next`, git, and test artifacts so the Linux image builds native `@node-rs/argon2`.

5. **CI `production-image` job.** `docker compose up --build -d`, wait for `/api/ready`, assert JSON `status: ready`. Do not drop or skip `quality`. App healthcheck uses Node `fetch` (no curl in slim image).

6. **Regression test in Vitest.** Parse Dockerfile and `ci.yml` so the default command and ready-check job exist without requiring Docker in the unit job.

## Risks / Trade-offs

- [Image build time on CI] → Separate job, cacheable layers (deps then source).
- [Type errors only in `next build`] → Run `pnpm build` locally and fix before push.
- [Seed needs extra files in prod image] → Accept larger image vs broken README seed.

## Migration Plan

Rebuild Compose (`docker compose up --build`). Rollback is revert of Dockerfile/compose/CI. No database migration.

## Open Questions

(none)
