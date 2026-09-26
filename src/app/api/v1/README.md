# API v1

REST JSON under `/api/v1`. Auth is a session cookie (`kickoff_session`) plus CSRF on mutating routes.

| Method | Path | Auth | Success |
|--------|------|------|---------|
| GET | `/api/v1/auth/csrf` | Public | 200 `{ csrfToken }` |
| POST | `/api/v1/auth/register` | Public + CSRF | 201 |
| POST | `/api/v1/auth/login` | Public + CSRF | 200 |
| POST | `/api/v1/auth/logout` | CSRF (session optional) | 204 |
| POST | `/api/v1/groups` | User + CSRF | 201 |
| GET | `/api/v1/groups` | User | 200 |
| GET | `/api/v1/groups/:id` | Member | 200 |
| POST | `/api/v1/groups/:id/invites` | Organizer + CSRF | 201 |
| GET | `/api/v1/invites/:code` | Public (code is secret) | 200 |
| POST | `/api/v1/invites/:code/accept` | User + CSRF | 200 |
| PATCH | `/api/v1/groups/:id/members/:userId` | Organizer + CSRF | 200 |
| DELETE | `/api/v1/groups/:id/membership` | Member + CSRF | 204 |
