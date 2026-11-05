# adjust-stock

Correcting a quantity product's stock (ADR 0030) — the one user action behind
`POST /stock/adjust` (permission `stock.adjust`, ADMIN only).

## Exposes

- `AdjustStockDialog` — one dialog, two modes:
  - **Write-off**: pieces removed + a required reason.
  - **Count correction**: the counted quantity; shows the resulting difference
    (`counted − current`) before saving. The server writes the difference.

## Must never

- Move money (this endpoint never does) or block on stock going negative.
