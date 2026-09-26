# API v1

REST JSON under `/api/v1`. Auth is a session cookie (`kickoff_session`) plus CSRF on mutating routes.

| Method | Path | Auth | Success |
|--------|------|------|---------|
| GET | `/api/v1/auth/csrf` | Public | 200 `{ csrfToken }` |
| POST | `/api/v1/auth/register` | Public + CSRF | 201 |
| POST | `/api/v1/auth/login` | Public + CSRF | 200 |
| POST | `/api/v1/auth/logout` | CSRF (session optional) | 204 |
| GET | `/api/v1/me` | User | 200 |
