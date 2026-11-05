# 0038 — HTTP client tolerates an empty 2xx body

Date: 2026-11-05
Status: Accepted

## Context

`GET /shifts/current` (ADR 0036) returns **200 with `Content-Length: 0`** when
the cashier has no open shift — a legal "no content, but not 204" reply. The
client's single HTTP caller (`client/src/shared/api/http.ts`) ended every
successful non-204 response with `response.json()`, which throws
`SyntaxError: Unexpected end of JSON input` on an empty body. That would crash
`useCurrentShift` in its most common state and silently defeat the selling gate.

## Decision

In `handleResponse`, after the 204 short-circuit, read the body as text and
parse only when non-empty; an empty 2xx body resolves to `null`:

```ts
const text = await response.text()
return (text ? JSON.parse(text) : null) as T
```

Repositories that expect a value still get it; those that may receive nothing
(like `shift.current()`, typed `ShiftReportView | null`) get `null`.

## Consequences

- Any endpoint may now answer 200 with an empty body without crashing the client.
- 204 keeps returning `{}` (unchanged) for callers that relied on it.
- One extra `await response.text()` per request; negligible, and it replaces the
  implicit text read `response.json()` already did.
