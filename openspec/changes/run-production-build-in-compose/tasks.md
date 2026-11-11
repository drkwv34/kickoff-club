# Tasks

## 1. Regression coverage

- [x] 1.1 Add a Vitest check that the Dockerfile default command is `pnpm start` (not `pnpm dev`) and that CI has a job which builds the image and smoke-tests `/api/ready`. Confirm it fails on the current Dockerfile and workflow.

## 2. Production image and CI

- [x] 2.1 Add a multi-stage Dockerfile (`next build` then `pnpm start`), `.dockerignore`, production Compose env, app healthcheck, and a CI job that builds the image and curls `/api/ready`. Keep `pnpm db:migrate` and `pnpm db:seed` working in the image. Verify 1.1 passes and `pnpm build` succeeds.

## 3. Validation

- [x] 3.1 Run `openspec validate run-production-build-in-compose --strict` and confirm it exits 0.
