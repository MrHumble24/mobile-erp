# 0058 — Branches and store scoping on phones (Android & iOS)

Date: 2026-11-06
Status: Accepted

## Context
The server and website support multi-store branches (ADR 0045, 0046) using `X-Store-Id`.
Phone apps previously lacked store awareness, causing `STORE_REQUIRED` for multi-store
users and queuing offline sales with unassigned store context.

## Decision
- **Active store saved on the phone**: `StoreManager` persists the active store ID in
  secure storage (survives app restart; cleared on logout). Single-store users auto-select
  without prompting. Users with several stores choose on a dedicated screen if none is saved.
- **One header in one place**: Injected via `HttpClient.kt` (Android) and `APIClient.swift` (iOS)
  on all requests except `/auth/login`. No screen sets the header manually.
- **A queued change keeps its store**: Offline writes in `OutboxEntity` (Room migration 6->7)
  and `OutboxEntry` (SwiftData) capture the originating `storeId` at enqueue time. Push drain
  sends this `storeId`, preserving origin store even if the user switches stores before syncing.
- **Store switching on More tab**: Switching stores clears in-memory state, wipes cached
  devices and products, resets sync cursor, and repulls for the new branch. Offline outbox
  is preserved. Users with a single store see branch name without switch controls.
- **No "all stores" on phones**: Multi-store summary/aggregation remains web-only.

## Consequences
- Multi-store phone operators work seamlessly across branches without data cross-contamination.
- Refusals (`STORE_REQUIRED`, `STORE_FORBIDDEN`) prompt store selection with translated messages.
