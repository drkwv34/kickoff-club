# Proposal

## Why

The signed-in header nav (Dashboard, Notifications, Settings, display name, Sign out) does not wrap or collapse at 390×844, so `document.documentElement.scrollWidth` exceeds `clientWidth` and the bar is hard to use on small phones. The product is specified as usable down to 375px.

## What Changes

- Make the primary header nav wrap or collapse at viewports ≤390px so the page does not scroll horizontally.
- Add Playwright coverage at 390×844 and 375 viewports asserting `scrollWidth <= clientWidth`.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `app-ui`: The site header MUST remain within the viewport width at 390px and 375px.
- `e2e`: Playwright MUST assert no horizontal overflow at those viewports.

## Impact

- `src/app/_components/site-header.tsx` and `src/app/globals.css`.
- Playwright e2e under `e2e/`.
