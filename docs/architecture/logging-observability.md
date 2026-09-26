# Logging & observability

## Format

Structured **JSON** logs (one object per line) with fields:

- `level` — `debug` | `info` | `warn` | `error`
- `timestamp` — ISO-8601
- `requestId` — propagated from incoming header or generated per request
- `route` — HTTP method + path for api layer
- `userId` — when authenticated (uuid string)
- `durationMs` — on request completion
- `message` — human-readable summary
- `code` — domain error code when applicable

## Redaction (mandatory)

**Never log:**

- Passwords or password hashes
- Session tokens or raw cookie values
- SMTP credentials
- Full invite secrets in production logs (truncate)

## Levels

- `debug` — local/dev only; off in production default
- `info` — request lifecycle, successful mutations summary
- `warn` — recoverable issues (retry scheduled, deprecated API)
- `error` — failures requiring attention

## Health

- `GET /api/health` — process alive (liveness)
- `GET /api/ready` — dependencies ready (readiness; DB when wired)

## Correlation

Accept `x-request-id` from clients or generate; attach to all logs and outbound email headers where applicable.

Implementation: `src/lib/logging/logger.ts` (`log`, `createLogger`, `newRequestId`; redacts passwords/tokens).
