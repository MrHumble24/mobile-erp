# entities/sale

Sale business object: types, query keys, repository, data hooks, receipt views.

## Public API (`index.ts`)

- Types: `SaleView`, `SaleBonus`, `SaleModelRef`, `TradeInView`, `SaleTradeInDto`,
  `SaleReturnRef`, `SaleStats`, `SalePage`, `SaleFilters`, `ReceiptView`,
  `WarrantyLookupView`, `CreateSaleDto`, `ReturnSaleDto`.
- `saleRepository` (the only HTTP caller), `saleKeys` (key factory).
- Hooks: `useSales`, `useSalesStats`, `useSale`, `useSaleReceipt`,
  `useWarrantyLookup`, `useCreateSale`, `useReturnSale`.
- `warrantyRemainingDays(endsAt)` — whole days of cover left, ceil, floored at 0
  (mirrors the server's `remainingWarrantyDays`; cross-package, cannot be shared).
- Receipt helpers: `ReceiptPrintView`, `useSaleReceipts`, `formatReceiptText`,
  `combineReceipts`, `receiptBonusLines`.

## Invariants

- A quantity sale (ADR 0030) has `device: null` and carries `model` + `quantity`
  instead; a unit sale has `model: null`. Resolve the subject with
  `shared/lib/sale-subject` (`saleModelName`, `saleUnitCode`), never `sale.device.…`
  directly. `ReceiptItem.quantity` is set only on a quantity line, `price` is its total.
- `landedCostSnapshot` / `netProfit` on `SaleView` and `netProfit` on `SaleStats`
  are optional: the server redacts them without `sale.profit.view`.
- `SaleView.payments` / `ReceiptView.payments` are the tender lines (`{accountCode,
  amount}`); `[]` for sales predating ledger posting. `combineReceipts` sums them
  per account across a multi-item cart; the receipt shows "Paid with …".
- `SaleView.tradeIns` / `ReceiptView.tradeIns` are phones taken in part payment
  (ADR 0039): `{deviceId, imei, serialNumber, model, value}`, `[]` when none. The
  `value` is customer-facing, never cost-redacted. `CreateSaleDto.tradeIns` carries
  them on checkout; the trade-in cart + allocation live in `features/checkout`.
- `SaleView.bonus` / `ReceiptView.bonus` are `{earned, spent}` decimal strings (ADR
  0043), `"0.00"` when none. `receiptBonusLines` is the single source for the two
  receipt points lines: "Paid with points" (spent > 0, with a minus, before the
  payments) and "Points earned" (earned > 0, near the bottom). `combineReceipts`
  sums both fields. Points use `formatNumber`, never `formatMoney`.
- `useReturnSale` invalidates `saleKeys.all` (list + stats + detail) and device lists.
- Components never import the repository; only hooks do.

## Never

Hold server lists in Zustand. Hand-write query-key arrays. Call `fetch` here
(goes through `shared/api/http`).
