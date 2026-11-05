# entities/sale

Sale business object: types, query keys, repository, data hooks, receipt views.

## Public API (`index.ts`)

- Types: `SaleView`, `SaleReturnRef`, `SaleStats`, `SalePage`, `SaleFilters`,
  `ReceiptView`, `WarrantyLookupView`, `CreateSaleDto`, `ReturnSaleDto`.
- `saleRepository` (the only HTTP caller), `saleKeys` (key factory).
- Hooks: `useSales`, `useSalesStats`, `useSale`, `useSaleReceipt`,
  `useWarrantyLookup`, `useCreateSale`, `useReturnSale`.
- `warrantyRemainingDays(endsAt)` — whole days of cover left, ceil, floored at 0
  (mirrors the server's `remainingWarrantyDays`; cross-package, cannot be shared).
- Receipt helpers: `ReceiptPrintView`, `useSaleReceipts`, `formatReceiptText`,
  `combineReceipts`.

## Invariants

- `landedCostSnapshot` / `netProfit` on `SaleView` and `netProfit` on `SaleStats`
  are optional: the server redacts them without `sale.profit.view`.
- `SaleView.payments` / `ReceiptView.payments` are the tender lines (`{accountCode,
  amount}`); `[]` for sales predating ledger posting. `combineReceipts` sums them
  per account across a multi-item cart; the receipt shows "Paid with …".
- `useReturnSale` invalidates `saleKeys.all` (list + stats + detail) and device lists.
- Components never import the repository; only hooks do.

## Never

Hold server lists in Zustand. Hand-write query-key arrays. Call `fetch` here
(goes through `shared/api/http`).
