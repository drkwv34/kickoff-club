# External integrations

## PostgreSQL

- Driver/ORM choice documented in OpenSpec (Day 2); connection via `DATABASE_URL`.
- Pool size modest for v1; use parameterized queries only.

## SMTP / email

- **Port:** `MailSender` interface in notifications module.
- **Local:** Mailpit (Compose) on `SMTP_HOST` / `SMTP_PORT` (default 1025).
- **Retries:** exponential backoff for outbox worker (future); max attempts documented per notification type.
- **Timeouts:** connect + send bounded (e.g. 10s total); fail → log + outbox retry.

## HTTP clients (future)

If calling external HTTP APIs:

- Explicit timeouts (connect + response)
- Retry only on idempotent GET or with idempotency keys
- No SSRF — validate URLs if user-supplied (N/A for kickoff v1 core)

## Circuit behavior

Not required v1; if SMTP repeatedly fails, mark outbox dead after N attempts and surface in ops logs.

## Secrets

Only via environment variables validated in `src/lib/config/env.ts`; never committed.
