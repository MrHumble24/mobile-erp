# Sales slice

Completed sales, receipts, returns, and warranty lookup.

## Owns
- Sales list (`GET /sales`) with filters, paginator, CSV export.
- Summary (`GET /sales/stats`) collapsed overview.
- Sale detail (`SaleDetailSheet`): model, IMEIs, facts, `sales.paidWithPoints` and `sales.pointsEarned` when > 0, receipt, return.
- Printable receipt (`ReceiptSheet`): store header from server response, items, payments, points spent/earned, footer. 58mm/80mm formatting via `BonusReceiptLayout`. Print button gated on `receiptPrintingEnabled`.
- Warranty lookup by IMEI.

## Public API
- `SalesModule.feature` — permission: `sale.read`.

## Must never
- Write offline (sales reads and returns are online-only).
- Show cost/profit omitted by server.
- Import another slice directly.

## Step 11 (Bonus Points & Printing)
- `SaleView` and `ReceiptView` carry `bonus: SaleBonus?`.
- `ReceiptView` carries `store: SaleStoreRef?` and `footer: String?`.
- `ReturnSheet` maps `SALE_UNIT_BOUGHT_BACK` and `TRADE_IN_REFUND_FORBIDDEN`.
