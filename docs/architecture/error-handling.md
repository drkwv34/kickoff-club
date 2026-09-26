# Error handling

## Domain errors

Define typed errors in `src/lib/errors/` (and module-specific extensions) with:

- `code` — stable machine string (e.g. `LAST_ORGANIZER`, `MATCH_FULL`, `INVALID_CREDENTIALS`)
- `message` — safe for logs; may differ from user copy
- optional `details` — structured, non-sensitive metadata

Domain and use-cases **throw or return** these types; they never construct `Response` objects.

## HTTP mapping (api layer)

Route handlers map domain errors to HTTP status:

| Pattern | HTTP | User-visible body |
|---------|------|-------------------|
| Validation / bad input | 400 | `code` + short message; field errors when useful |
| Authn missing/invalid | 401 | Generic message (no leak) |
| Authz denied | 403 | `code` where safe |
| Not found | 404 | Avoid existence leaks on auth-sensitive resources |
| Conflict / invariant | 409 | `code` (e.g. `LAST_ORGANIZER`) |
| Gone / expired invite | 410 | When FR specifies |
| Unexpected / infra | 500 | Generic message; **no stack traces** to clients |

**User-visible vs internal:** Clients receive `code`, safe `message`, and optional `details`. Logs include `requestId`, `code`, and internal context (never passwords, session tokens, or raw SMTP credentials).

Postgres `23505` unique violations map to `UNIQUE_VIOLATION` (HTTP 409) via `mapUnknownError` — never return SQL `DETAIL` to clients (FR-ERR-004).

## Unknown errors

Catch at handler boundary; log at `error` with stack; return `INTERNAL_ERROR` JSON.

## FR-ERR alignment

Uniform invalid login message; validation lists field keys; domain codes documented in OpenSpec changes when added.
