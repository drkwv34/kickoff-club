# Tasks

## 1. OpenSpec and planning

- [x] 1.1 Create change `add-readme-demo-seed` (proposal, design, delta spec, tasks)

## 2. Demo seed implementation

- [x] 2.1 Add `runDemoSeed()` with stable IDs, documented credentials, upcoming match timing
- [x] 2.2 Add `pnpm db:seed` script and CLI entry `src/lib/db/seed.ts`
- [x] 2.3 Vitest: seed runs twice without duplicate demo entities
- [x] 2.4 CI: run `pnpm db:seed` twice after migrate/verify

## 3. Documentation and env

- [x] 3.1 Rewrite `README.md` with nine sections in mandated order; CI badge; Compose + seed instructions
- [x] 3.2 Complete `.env.example` (incl. optional `LOG_LEVEL`)

## 4. GitHub metadata

- [x] 4.1 Attempt GitHub About description + topics; document fallback if API denies (403 — documented in README)

## 5. Validation

- [x] 5.1 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `npx @fission-ai/openspec@latest validate add-readme-demo-seed --strict`
