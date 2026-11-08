# auth module

Session-based identity (FR-AUTH-001..003).

- `domain/` — register, login, logout, profile update, password reset, session policy (no React/Next).
- `infra/` — Argon2id hasher, Drizzle user/session/password-reset repositories.
- HTTP wiring lives in `src/app/api/v1/auth/` and `src/lib/http/`.
