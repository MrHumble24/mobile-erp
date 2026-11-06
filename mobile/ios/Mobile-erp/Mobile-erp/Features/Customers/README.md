# Customers slice

Customer directory, detail, purchase history, and bonus points ledger.

## Owns
- Searchable customer list (`GET /customers`) with sort, filters, and CSV.
- Summary tiles (`GET /customers/stats`).
- Detail sheet: profile, sales, credit, and bonus points (`GET /customers/:id/bonus`,
  ADR 0043) with history ledger and manual correction (`bonus.adjust`).
- Create and edit (`POST`/`PATCH /customers`), gated on `customer.manage`.

## Public API
- `CustomersModule.feature` — permission: `customer.read`.

## Must never
- Read/write offline: customers have no offline feed; writes block offline.
- Import another feature slice.

## Notes
- Detail loads bonus points online when enabled, showing balance, ledger history,
  and signed corrections sheet with pure validation.
- All actions run through `container.api`. Online-only.
