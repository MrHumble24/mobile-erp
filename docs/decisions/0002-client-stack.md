# 0002 — Client stack: React Router, React Query, repository layer, Zustand

Date: 2026-11-01 · Status: accepted

## Context
The client is an offline-tolerant POS used on several terminals. Server data must be cached, deduped and invalidated predictably; client-only state (cart drafts, scanner mode, session) must stay separate from it.

## Decision
- **React Router** for routing; route table in `app/router/`, pages lazy-loaded, role guards as layout routes.
- **React Query** owns all server state, with Devtools in dev builds. One `QueryClient` in `app/providers`.
- **Repository layer** (`shared/api/http.ts` + `entities/<x>/api/<x>.repository.ts`) is the only code that performs HTTP. Pure functions, DTO → domain mapping.
- **Custom hooks** (`*/model/use-*.ts`) wrap React Query around repositories; components never call `useQuery` or a repository directly.
- **Zustand** for client-only state, one store per concern inside the owning slice, accessed via selectors.
Full placement rules: `.agent/rules/client-stack.md`.

## Consequences
- Clear seams: swapping the transport touches `shared/api` only; swapping a cache policy touches `app/providers` only.
- Slightly more files per entity (keys, repository, hook) — each small, matching the file-size rule.
- Dependencies installed 2026-11-01: `react-router` 8.5, `@tanstack/react-query` 5.105, `zustand` 5.0, `@tanstack/react-query-devtools` 5.105 (dev).
