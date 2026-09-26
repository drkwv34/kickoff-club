# Design patterns & layering

## Patterns in use

| Pattern | Where |
|---------|--------|
| **Layered architecture** | ui → api → domain → infra |
| **Repository** | infra implements persistence ports defined as interfaces consumed by domain |
| **Adapter** | Email via `MailSender` port; Mailpit/SMTP in infra |
| **Policy / authz** | Pure functions: `canManageMatch(actor, match, membership)` |
| **Outbox** (recommended) | `notification_outbox` for reliable email send |

## Dependency rule

Dependencies point **inward**: infra → domain interfaces, never domain → infra concrete types. Wire implementations in route handlers or a small composition root.

## Route handlers (api)

Thin: authenticate, parse Zod, call use-case, map result/error to JSON.

## UI

Server Components by default; client components only for interactivity. No business rules duplicated in UI — call `/api/v1` or server-side use-cases from Server Actions when appropriate.

## OpenSpec

Structural changes (new module, split process) require an OpenSpec proposal before implementation.
