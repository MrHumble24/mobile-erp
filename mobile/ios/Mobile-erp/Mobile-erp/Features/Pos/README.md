# Pos slice

POS terminal: scan IMEIs into a multi-device cart → set per-line terms →
checkout (one sale per device; the server's `CreateSaleDto` takes a single
`imei`, so the cart fans out to one `POST /sales` / one outbox entry per line).

## Owns
- Device scan + gate (exists, IN_STOCK, not already queued offline, not a
  duplicate of a line already in the cart). A scan never adds silently: it
  resolves the device and opens the shared `ScanConfirmSheet`; the line joins
  the cart only on Confirm (`confirmScan()`). A failed gate opens the sheet's
  error variant (Close only). Drives via `PosViewModel.pendingScan`.
- The cart (`PosCart`): lines with price/warranty/notes + one shared customer,
  attached from an existing match (`GET /customers/lookup` typeahead) or added
  inline (name/phone). Existing id and inline name are mutually exclusive.
- Checkout fans out per line: online `POST /sales`, else enqueue `sale.create`
  to the outbox with `expectedVersion` = scan-time device version (ADR 0007).
  A toast reports the count; completed sales open the receipt result sheet.
- The post-sale 58mm receipt (built from local data; copy + system print).

## Public API
- `PosModule.feature` — the one registry line. Permission: `sale.create`.

## Must never
- Mutate the shared device cache (a pending sale is tracked via the outbox).
- Enqueue anything but `sale.create`; every other write is online-only.
- Import another feature slice (the print helper is duplicated on purpose).
- Read cost fields — none are modelled here.

## Offline
- Device lookup is cache-only (`DeviceEntity` by IMEI). A device not yet synced
  reads as "not found"; a sync refresh brings new stock in.
- Each cart line queues its own `sale.create` to the outbox (own
  `clientMutationId` + `expectedVersion`); receipts render with a "pending"
  badge. Customer typeahead is online-only (no attach panel search offline).

## Notes
- `pos.alreadyQueued` / `pos.duplicateDevice` have web i18n keys; the queued
  fallback string is English only.
- Inline NEW customer on a multi-line cart posts the same inline customer per
  line (the server returns no customer id to reuse), so N lines may create N
  customers — attach an existing customer to avoid it. Matches the web.

## Note
- Named `Pos.README.md` (not `README.md`) to avoid a synchronized-group bundle
  resource basename collision; see the Sales slice note.

## Dual-SIM (second IMEI)
- The offline cache lookup matches either IMEI (`imei == x || imei2 == x`).
  `ScannedDevice`/`CompletedSale` carry `imei2`; when a scan resolves via the
  second IMEI the `ScanConfirmSheet` subtitle shows both so the cashier sees the
  match. POS receipt / result rows show IMEI 2 when present.

## Trade-in at the till (Step 9, ADR 0039)
- The "Trade-in" action (checkout bar) shows only with `purchase.create`, needs
  a customer, and is online only. `PosTradeInSheet` adds a phone (model +
  identifier + value) to `cart.tradeIns`; rows show a minus amount in the cart.
- `TradeInAllocation` (pure, `TradeInAllocationSelfCheck`) places each trade-in
  on one line (largest first, price ≥ value). Checkout tenders `amountToPay`
  (cart − trade-ins); each line posts `tradeIns[]` with `payments` summing to
  `salePrice − Σ values`. A sold line's trade-ins are dropped (no double-send on
  retry); a trade-in cart is never queued offline; credit is hidden with a
  trade-in. `PosTradeInSheet`/`PurchaseModel` are reused from `Features/Purchases`.
