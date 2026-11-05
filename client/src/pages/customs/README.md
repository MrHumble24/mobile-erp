# pages/customs

Route `/customs` (ADR 0027). The customs price list: the current version with each
code's fee, previous fee, up/down/same/new marker and whether a model uses it;
the models still without a fee and why; and every past version. Reads need
`customs.read`; the "new price list" action needs `customs.manage`.

## Composes

- `entities/customs` hooks for the reads (current / versions / unmatched).
- `features/create-price-list` for the new-version dialog.

## Must never

- Write the price list itself — that goes through the feature's mutation.
- Build a file upload (no Excel file from the client yet — ADR 0027).
