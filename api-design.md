# Skill: API Design - Suffa

Applies to all routes under `app/api/`.

## Conventions

- REST-ish, resource-based routes: `/api/pods`, `/api/pods/[id]`, `/api/checkpoints`, etc. - avoid RPC-style action endpoints except for the AI generation calls, which are inherently actions (`/api/lessons/generate`, `/api/checkpoints/grade`)
- Every route handler validates `masjid_id` scoping before touching the database - no query should ever be able to return another masjid's data, even in a single-tenant demo. Treat this as non-negotiable, not a nice-to-have.
- Role checks happen at the route level, not just in the UI. A student's session should not be able to call an admin-only endpoint even if they craft the request manually.
- AI generation endpoints (`lib/ai/*`) should return persisted results, not raw model output passed straight to the client - always write to the DB first, then return the persisted row. This protects the continuity guarantee described in `docs/ARCHITECTURE.md`.
- Keep response shapes flat and predictable - the three dashboards are built by the same small team under time pressure, so consistency saves more time than cleverness.

## Error handling

- Return meaningful status codes (400 for bad input, 403 for role mismatch, 404 for missing resource) - a hackathon demo still benefits from this when something breaks live during Q&A
- AI generation calls should have a graceful fallback (e.g., a cached/default lesson) if the Anthropic API call fails during a live demo - do not let a network hiccup kill the walkthrough

## What not to over-engineer

- No need for API versioning, rate limiting, or pagination beyond what's trivially needed for a handful of demo students/pods
- No GraphQL, no tRPC unless already comfortable with it - plain REST routes are faster to build and easier to debug live
