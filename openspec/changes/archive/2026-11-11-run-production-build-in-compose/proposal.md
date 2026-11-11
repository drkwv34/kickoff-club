# Proposal

## Why

The Compose app image runs `pnpm dev`, so reviewers see the Next.js development overlay and a process that is not the production server. FR-level demo review expects `next build` plus `pnpm start` while still allowing `docker compose exec app pnpm db:seed`.

## What Changes

- Replace the single-stage `CMD ["pnpm", "dev"]` image with a multi-stage Dockerfile that runs `next build` at image build time and `pnpm start` as the default command.
- Keep migrations and demo seed working against the same image (`migrate` service and `docker compose exec app pnpm db:seed`).
- Set Compose `NODE_ENV` so the running app is the production server (no Next.js dev badge).
- Add a CI job that builds the image and smoke-tests `GET /api/ready`.
- Fix any TypeScript errors the production build surfaces.

## Capabilities

### New Capabilities

- `compose`: Docker Compose app image is a production Next.js server, with migrate/seed still runnable in that image.

### Modified Capabilities

- `e2e`: CI MUST include a job that builds the Compose app image and smoke-tests `/api/ready`.

## Impact

- `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `.github/workflows/ci.yml`.
- Possible `next build` type fixes.
- README Compose notes if the start command wording is now inaccurate.
