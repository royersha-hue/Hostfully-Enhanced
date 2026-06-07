# Threat Model

## Project Overview

This repo is a pnpm monorepo for a short-term rental host management product. The main production-facing artifact is an Expo/React Native manager app in `artifacts/airbnb-manager` that is served through a small Node static server for the landing page and mobile manifests. The repo also contains an Express API in `artifacts/api-server` plus shared OpenAPI and Drizzle/Postgres packages in `lib/`.

Today, the manager app is effectively a local-first demo/client application: guest, booking, conversation, and analytics records come from repo-controlled seed data, and current UI mutations live only in React state. The backend exposes `/api/healthz` and source code for Stripe-backed catalog and checkout routes. On the tested public deployment, the health route is live while the Stripe routes currently return 404, so payment code should be treated as a production-capable surface that merits immediate review when enabled or redeployed.

Production assumptions for this scan:
- `NODE_ENV=production` in deployed environments.
- Replit terminates TLS for deployed traffic.
- The mockup sandbox is not deployed to production.
- The tested deployment is public.

## Assets

- **Manager-entered operational content** — replies, booking notes, and guest communication entered through the app may contain access instructions, Wi‑Fi details, or other hospitality workflow secrets. This is the most important future confidentiality asset once persistence or sync is added.
- **Repo-controlled demo guest and property data** — the app bundle currently contains mock guest names, booking details, and sample operational text. This is lower sensitivity than live production data, but it still defines what is publicly exposed in the distributed client.
- **Request-header trust on the static server** — `Host` influences server-generated HTML and canonical URLs, so mishandling it can create XSS or availability impact.
- **Stripe integration and catalog state** — if the Stripe API routes are enabled, Stripe secret retrieval, synced product/price data, checkout-session creation, and webhook processing become security-relevant assets.
- **Application secrets and infrastructure config** — environment variables such as `DATABASE_URL`, integration identity tokens, deployment domain values, and other server-side configuration.
- **API/database boundary** — `lib/db` holds direct database connectivity via `DATABASE_URL`; compromise of future API routes would expose the PostgreSQL connection and any server-side data added later.

## Trust Boundaries

- **Public user to manager app boundary** — the client is untrusted. Any future real manager-only views or data must be protected before being delivered to a browser or device.
- **Browser/mobile runtime to in-memory client state boundary** — current guest, booking, and message mutations live only in client memory. This limits present-day persistence risk, but any future move back to AsyncStorage, filesystem, or server sync changes the confidentiality model immediately.
- **HTTP request to static server boundary** — untrusted request metadata such as `Host` crosses into server-generated HTML and request parsing.
- **Client to Express API boundary** — all `/api/*` requests cross from untrusted clients into the server.
- **API to PostgreSQL boundary** — the API server has direct database access through `lib/db`.
- **API to Replit integrations / Stripe boundary** — Stripe credentials are fetched from Replit-managed integration infrastructure, and checkout/webhook flows depend on trusted communication with Stripe.

## Scan Anchors

- **Production entry points**: `artifacts/airbnb-manager/app/_layout.tsx`, `artifacts/airbnb-manager/server/serve.js`, `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`.
- **Highest-risk code areas**: `artifacts/airbnb-manager/server/serve.js`, `artifacts/api-server/src/routes/stripe.ts`, `artifacts/api-server/src/stripeClient.ts`, `artifacts/api-server/src/webhookHandlers.ts`, `lib/api-client-react/src/custom-fetch.ts`.
- **Public surfaces**: Expo landing page and manifest server, distributed mobile app bundle with repo-controlled demo data, `/api/healthz`, and `/api/stripe/*` if the API artifact is deployed with payment routes enabled.
- **Authenticated/admin surfaces**: none implemented yet. Do not treat missing auth alone as a present-day finding while the app remains local-first and does not serve shared manager records.
- **Dev-only areas to usually ignore**: `artifacts/mockup-sandbox/**`, `artifacts/airbnb-manager/scripts/**` unless directly reachable in production.

## Threat Categories

### Spoofing / Broken Access Control

The current shipped app does not yet expose authenticated shared manager data, so missing login alone is still mostly a roadmap concern. This category becomes actionable as soon as the API starts serving real guest, booking, or subscription state tied to specific operators. If the Stripe routes become live, any future portal, subscription-management, or customer-specific endpoints must bind actions to a verified user identity rather than trusting client input.

### Information Disclosure

The main present-day disclosure risks are unsafe reflection of request-header values into server-generated HTML and verbose server responses from future API routes. The earlier assumption that manager data is durably persisted client-side is no longer accurate for the current codebase; confidentiality risk will rise sharply if local persistence or backend sync is reintroduced. If Stripe-backed routes are enabled, errors must not leak integration, database, or internal operational details to unauthenticated callers.

### Tampering

The app currently keeps business state client-side in memory, so any displayed booking status, guest additions, or message edits are user-controlled and not authoritative. Any future workflow that depends on these values must revalidate them server-side instead of trusting the client. For payments, server-side code must validate any client-selected catalog identifiers against allowed products before using them to create durable Stripe objects.

### Denial of Service

The public static server must continue to fail closed on malformed request metadata rather than crashing. If Stripe routes are enabled publicly, checkout creation and other third-party calls become an abuse surface: unauthenticated request volume can consume application capacity, create external API noise, and increase operational load unless bounded appropriately.

### Elevation of Privilege

If future manager functionality becomes backed by shared server-side data, arbitrary visitors must not be able to reach privileged flows simply by possessing the app bundle or guessing client routes. As the API grows, all routes that expose guest, booking, or subscription data must enforce authorization server-side and must not rely on frontend routing or generated API clients for privilege separation.
