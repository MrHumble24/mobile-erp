# features/warranty-lookup

Look up a sale by IMEI/serial, show its warranty and process a return.

## Public API

- `WarrantyLookupPanel` — the till's warranty search and sale summary.
- `ReturnSaleDialog` — refund amount, returned condition and reason; a credit
  sale refunds nothing (it lowers the debt).

## Return refusals

`lib/return-error.ts` maps a server `code` to a `sales.*` message:
`SALE_UNIT_BOUGHT_BACK` (the phone was bought back since) and
`TRADE_IN_REFUND_FORBIDDEN` (the trade-in part needs `purchase.create`). Any
other 409 keeps the generic "sale changed" text. The code is read with the
shared `httpErrorCode`.

## Must never

- Recompute a refund cap the server also enforces; the dialog's cap is only a
  guard for the cashier.
- Print a trade-in value as money paid — the trade-in part is refunded in cash.
