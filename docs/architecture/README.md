# Architecture overview — kickoff-club

Agent and human implementers must follow these constraints (SRS §8). Feature code belongs in the layers below; **domain never imports React or Next**.

## Layer diagram

```
┌─────────────────────────────────────────────────────────┐
│  ui — React components, App Router pages (src/app/)      │
└───────────────────────────┬─────────────────────────────┘
                            │ props / server actions / fetch
┌───────────────────────────▼─────────────────────────────┐
│  api — Route handlers (src/app/api/v1/...)               │
│        Parse HTTP, auth context, map errors → status      │
└───────────────────────────┬─────────────────────────────┘
                            │ calls use-cases
┌───────────────────────────▼─────────────────────────────┐
│  domain — use-cases, entities, invariants               │
│           (src/modules/*/domain/)                       │
└───────────────────────────┬─────────────────────────────┘
                            │ ports
┌───────────────────────────▼─────────────────────────────┐
│  infra — Postgres, SMTP, clocks (src/modules/*/infra/,  │
│          src/lib/db/)                                     │
└─────────────────────────────────────────────────────────┘
```

## Repository layout

| Path | Role |
|------|------|
| `src/app/` | Next.js routes, layouts, global UI |
| `src/app/api/v1/` | REST JSON API (`/api/v1/...`) |
| `src/modules/auth/` | Identity & sessions (register / login / logout) |
| `src/modules/groups/` | Groups, membership, invites |
| `src/modules/matches/` | Matches & series |
| `src/modules/rsvps/` | RSVP & waitlist promotion |
| `src/modules/notifications/` | In-app + email outbox |
| `src/lib/` | Shared config, logging, HTTP helpers |
| `src/lib/db/` | Drizzle schema + client |
| `drizzle/` | Forward-only SQL migrations (see [persistence](./persistence.md)) |
| `openspec/` | Change proposals |

Each module typically contains:

- `domain/` — entities, value objects, use-case functions
- `infra/` — repository implementations
- `index.ts` — public module exports (domain types only outward)

## Cross-cutting docs

- [Error handling](./error-handling.md)
- [Transactionality](./transactionality.md)
- [Domain modeling](./domain-modeling.md)
- [Logging & observability](./logging-observability.md)
- [Design patterns & layering](./design-patterns.md)
- [Testing strategy](./testing-strategy.md)
- [External integrations](./external-integrations.md)
- [Frontend conventions](./frontend-conventions.md)
- [App-specific conventions](./app-conventions.md)
- [Persistence (Drizzle)](./persistence.md)

## Config & API

- Environment validated at process boot with **Zod** (`src/lib/config/env.ts`). Invalid config → fail fast, no partial startup.
- **REST** under `/api/v1`, JSON bodies, stable error `code` fields.
- **OpenSpec gate:** see [`openspec/README.md`](../../openspec/README.md).

## Package manager

**pnpm** with committed `pnpm-lock.yaml`. Do not mix npm/yarn lockfiles.
