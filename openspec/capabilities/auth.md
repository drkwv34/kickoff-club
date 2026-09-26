# Capability: auth

**Status:** schema foundation (Day 2). Use-cases and UI: Day 3.  
**SRS:** FR-AUTH-001..003 (Must), FR-AUTH-004 (Should, not started).  
**OpenSpec:** [`changes/2026-09-26-auth-foundation`](../changes/2026-09-26-auth-foundation/).

## What exists now

- Tables `users` and `sessions` (Postgres via Drizzle).
- Env: `DATABASE_URL`, `SESSION_SECRET` (≥32 characters) required at boot.
- Domain error skeleton for credentials and unique email.

## What this capability will do

Session-based identity: register, sign in, sign out, HttpOnly cookies, CSRF on mutating routes. Passwords hashed (Argon2id or bcrypt ≥12). Email unique case-insensitively.

## Explicitly not this capability (yet)

OAuth, password reset, auth pages, `/api/v1/auth/*` handlers.
