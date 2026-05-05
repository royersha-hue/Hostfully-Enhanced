# Threat Model

## Project Overview

This repo is a pnpm monorepo for a short-term rental host management product. The production-facing surfaces are an Expo/React Native manager app (`artifacts/airbnb-manager`) that can also be served through a static landing-page server, plus a small Express API (`artifacts/api-server`) with shared OpenAPI and Drizzle/Postgres packages in `lib/`.

Today, the manager app is effectively a local-first client application: it loads booking, guest, conversation, and analytics data from repo-controlled seed data and persists some message state locally with AsyncStorage. The backend currently exposes only a health-check route. The mockup sandbox under `artifacts/mockup-sandbox` is a development-only UI environment and is out of scope unless production reachability is proven.

Production assumptions for this scan:
- `NODE_ENV=production` in deployed environments.
- Replit terminates TLS for deployed traffic.
- The mockup sandbox is not deployed to production.

## Assets

- **Locally persisted manager message history** — guest names, conversation previews, and any operator-entered replies stored through AsyncStorage. This is the most concrete present-day confidentiality asset because it can contain real operational instructions entered during use.
- **Operational access details** — message content and quick-reply content may include property access instructions, Wi‑Fi details, and other hospitality workflow secrets.
- **Request-header trust on the static server** — `Host` and `X-Forwarded-*` values influence server-side HTML generation and request parsing, so mishandling them can create XSS or availability impact.
- **Application secrets and infrastructure config** — environment variables such as `DATABASE_URL`, deployment domain values, and runtime headers trusted by the server.
- **API/database boundary** — even though the current API surface is minimal, compromise of the API or future expansion of it would expose the PostgreSQL connection and any future server-side data.

## Trust Boundaries

- **Public user to manager app boundary** — the client is untrusted. Any real manager-only views or data must be protected before being delivered to a browser or device.
- **Browser/mobile runtime to local device storage boundary** — data persisted through AsyncStorage is exposed to the local device context rather than protected server-side storage.
- **HTTP request to static server boundary** — request headers such as `Host` and `X-Forwarded-*` cross from untrusted network clients into server-generated HTML and request parsing.
- **Client to Express API boundary** — all `/api/*` requests cross from untrusted clients into the server.
- **API to PostgreSQL boundary** — `lib/db` holds direct database connectivity via `DATABASE_URL`; any future expansion of the API must treat this as a high-impact boundary.

## Scan Anchors

- **Production entry points**: `artifacts/airbnb-manager/app/_layout.tsx`, `artifacts/airbnb-manager/server/serve.js`, `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`.
- **Highest-risk code areas**: `artifacts/airbnb-manager/context/AppContext.tsx`, `artifacts/airbnb-manager/server/templates/landing-page.html`, `artifacts/airbnb-manager/server/serve.js`, `lib/api-client-react/src/custom-fetch.ts`.
- **Public surfaces**: Expo landing page and manifest server, distributed manager app, `/api/healthz`.
- **Authenticated/admin surfaces**: none implemented yet. Do not treat missing auth alone as a present-day finding while the app remains local-first and uses repo-controlled seed data; revisit immediately if real shared or server-backed manager data is introduced.
- **Dev-only areas to usually ignore**: `artifacts/mockup-sandbox/**`, `artifacts/airbnb-manager/scripts/**` unless directly reachable in production.

## Threat Categories

### Spoofing / Broken Access Control

The manager application is administrative in nature, so future versions that protect real shared data will need authentication and authorization. In the current codebase, missing auth is primarily a roadmap risk rather than a standalone present-day finding because the app is local-first, backed by repo-controlled seed data, and does not yet expose shared server-backed records. This category becomes immediately actionable if the app starts serving real manager data from a backend or multi-user store.

### Information Disclosure

The concrete present-day confidentiality risks are insecure local persistence of manager-entered message history and unsafe reflection of request-header values into server-generated HTML or JavaScript. Sensitive operational content must not be exposed through plaintext client storage, verbose responses, or header-driven HTML generation.

### Tampering

The current app keeps business state entirely client-side. Any future production workflow that depends on booking status, messaging history, or analytics must treat the client as untrusted and revalidate state server-side rather than trusting locally modified app data.

### Denial of Service

The exposed backend is small, but the public static server still must safely parse attacker-controlled request metadata. Malformed headers or other invalid request inputs must fail closed with bounded error handling rather than crash the process.

### Elevation of Privilege

If future manager functionality becomes backed by shared server-side data, arbitrary visitors must not be able to reach privileged flows simply by possessing the app bundle or client routes. As the API grows, all routes that expose guest or booking data must enforce authorization server-side and must not rely on the client or generated API hooks for privilege separation.