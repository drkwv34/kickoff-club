# Tasks

## 1. Playwright config and scripts

- [x] Add `webServer` (build + start), reuse env vars, keep CI retries=1 / workers=1
- [x] Add `test:e2e` and `test:e2e:ui` scripts in `package.json`

## 2. E2e spec and helpers

- [x] Add `e2e/helpers/auth.ts` for register/login via UI
- [x] Add `e2e/critical-path.spec.ts`: waitlist promotion (two contexts, invite join)
- [x] Add no-show UI assertion with Postgres backdate helper for match start
- [x] Update `e2e/README.md` with local prerequisites and commands

## 3. CI

- [x] Extend `.github/workflows/ci.yml`: build step, Playwright browser install, `pnpm test:e2e`

## 4. Docs and OpenSpec

- [x] Align `docs/architecture/testing-strategy.md` CI section
- [x] Run `openspec validate add-playwright-e2e-ci --strict`
