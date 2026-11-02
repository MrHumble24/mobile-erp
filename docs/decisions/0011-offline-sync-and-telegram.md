# 0011 — Offline sync push/conflicts and Telegram alerts

Date: 2026-11-02
Status: Accepted

## Context

Wave 3 needs a server endpoint for POS terminals to drain their offline mutation
queue, a way to resolve the IMEI state-lock conflicts that result, an offline
cache feed, and owner-facing Telegram alerts (PRD §5, Module 6).

## Decision

- **Push semantics** (`POST /sync/push`): mutations apply **in order**. Each is
  permission-checked, validated with the owning module's DTO, then dispatched to
  the existing service (`clientMutationId = id`, `expectedVersion = baseVersion`)
  via a handler-per-type registry (no switch chains, no raw status mutation —
  that would bypass checkout guards). Outcomes: `applied`, `duplicate` (replay of
  a known `clientMutationId`), `conflict` (ConflictException → a `sync_conflicts`
  row keyed by deviceId), `rejected` (missing permission / invalid / other error).
  **Rejected mutations are never persisted** — the terminal keeps and retries them.
- **Conflict resolution**: `keep-server` records the decision; `apply-terminal`
  re-dispatches the stored mutation at the device's *current* version and, if it
  still clashes (e.g. already SOLD), returns 409 and leaves the conflict pending.
  **No force path** — an admin uses keep-server and handles the unit manually.
  `note` is accepted in the request but not stored (no column; audit via logs).
- **Changes feed** (`GET /sync/changes`): devices changed since a cursor (cap
  2000, `nextSince` to page) + all active partners (with balances), each carrying
  its latest sale and latest QC inspection. **No cost fields are selected at all**,
  independent of the redaction interceptor.
- **Telegram**: all message text in one `telegram/messages.ts` (English
  placeholders) pending Uzbek translation by Gemini. Events emitted by owning
  services; alerts best-effort and never throw into a sale. The closing digest
  uses a once-per-day marker, a new nullable `StoreSettings.digestSentOn`
  (`@db.Date`), checked by a minute-cron against `closingTime`.

## Consequences

- Safe, replayable offline sync with an auditable conflict trail; cashiers never
  see cost data through the feed. Adding a mutation type = one handler file + one
  registry entry. If audit needs resolution notes, add a `note` column later.
