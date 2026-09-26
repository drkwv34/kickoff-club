# Database migrations

## Tooling

Migration runner and ORM choice will be locked in an OpenSpec change (Day 2). Until then, this folder holds **naming conventions only** — no product tables on Day 1.

## Forward-only

- Never edit a migration that has been applied on any shared environment.
- Fix mistakes with a **new** migration file.

## Naming

```
YYYYMMDDHHMMSS_short_snake_description.sql
```

Example: `20260926120000_create_users.sql`

## Order

Lexicographic by timestamp prefix. One logical change per file when possible.

## CI

Future: apply all migrations on fresh Postgres in GitHub Actions before integration tests.
