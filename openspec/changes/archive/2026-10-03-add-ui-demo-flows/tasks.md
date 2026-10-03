# Tasks

## 1. Landing and shared UI

- [x] 1.1 Build marketing landing at `/` with feature sections and CTAs; verify anonymous and signed-in states render correctly in dev
- [x] 1.2 Add `EmptyState` component and panel/landing CSS tokens; verify empty states use `role="status"`

## 2. Role-aware app pages

- [x] 2.1 Polish `/app` dashboard empty state and group list layout; verify zero-group copy appears above join/create forms
- [x] 2.2 Update group detail for organizer vs player empty matches and section headings; verify players do not see create-match links
- [x] 2.3 Style RSVP panel on match detail; verify Going button is focusable and panel matches surface styling

## 3. Form accessibility

- [x] 3.1 Add `aria-describedby` for hints/errors on auth, create-group, create-match, and join-invite forms; verify unique datalist IDs on `/app`
- [x] 3.2 Polish notifications empty state if needed; verify `/app/notifications` shows guidance when empty

## 4. Verification

- [x] 4.1 Run `pnpm lint`, `pnpm test`, and `npx @fission-ai/openspec@latest validate add-ui-demo-flows --strict`; verify all pass
- [x] 4.2 Dogfood Compose happy path (register → group → match → RSVP) without API tools; verify flow completes in browser
