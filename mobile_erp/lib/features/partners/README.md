# partners slice

Partner directory, balances, ledger and payments. Mirrors the web `partners`
page + `record-partner-payment` feature.

## Owns
- Offline-first partner table (shopName, phone, creditLimit, outstanding) read
  straight from the Drift `partners` cache (hydrated by `/sync/changes`).
- Create-partner dialog, record-payment dialog, ledger drawer.

## Public API
- `partners_module.dart` → `partnersRoutes`, `partnersNavItems` (route
  `/partners`, perm `partner.read`).

## Must never do
- Edit `data/local/` or any other slice. Partner reads go through the Drift DAO;
  writes go through `PartnerRepository`.
- Queue to the outbox: create and payment are **online-only** (no server offline
  handler) and block when offline with `common.offline`.

## Open questions
- `openCount` / `overdueCount` are not in the Drift cache, so the mobile table
  omits them (web shows them from the full `GET /partners`). Add if a cached
  summary ships.
