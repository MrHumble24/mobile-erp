# Stock transfer entity

Owns the client contract for inter-store stock transfers (ADR 0045, ADR 0046).

- `model/` — `StockTransferView`, DTOs, React Query hooks (`useStockTransfers`, mutations).
- `api/` — `stockTransferRepository` and query keys (`/stock-transfers`).
- `ui/` — `StockTransferStatusBadge`.
