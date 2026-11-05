# 0046 — Multi-store branch switching and transfers UI (client)

Date: 2026-11-05
Status: Accepted

## Context
The client needs to support multiple stores: header store switching, store
administration, user-store assignments, inter-store stock transfers, and an
"All stores" summary for owners on reports and balance pages.

## Decision
- **Active store in Zustand** (`features/switch-store`): persists `currentStoreId`.
  `shared/api/http.ts` injects `X-Store-Id` on all requests. When switching store,
  React Query cache is cleared and offline device cache is purged and repulled.
- **StorePicker**: Shown in header when user has >1 store assigned (from `/auth/me`).
  Single-store users see no picker and automatically use their assigned store.
- **Transfers page** (`pages/transfers`): Lists transfers by status (SENT, RECEIVED, CANCELLED).
  Create modal supports barcode scanning for units and dropdown for quantity accessories.
  Receiving allowed only when active store matches destination; cancelling allowed when SENT.
- **Stores page** (`pages/stores`): Admin store CRUD and deactivation.
- **All stores view**: Toggled on `/reports` and `/balance` for users with `store.all`.
  Sends `X-Store-Id: all`. Balance page displays company total and store breakdown table,
  hiding mutation forms and single-store history.
- **Offline mutations**: Stored with originating `storeId` to replay in the proper context.

## Consequences
- Fast store switching without state contamination across stores.
- Clean FSD layout preserving existing POS and inventory workflows.
