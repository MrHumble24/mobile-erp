# pages/purchases

Route `/purchases` (guard `purchase.read`): phones bought from customers (Change
14, ADR 0039), newest first, with a date filter and IMEI/serial search. A row
opens the detail; the "Buy a phone" action (guard `purchase.create`) opens the
dialog from `features/buy-phone`.

## Composes

- `entities/customer-purchase` — list + detail hooks.
- `features/buy-phone` — the buy dialog.
- `shared/ui` — PageHeader, Table, Sheet, Input, Button.

## Notes

- `pricePaid` is hidden where the server omits it (no `device.cost.view`).
- A trade-in row carries a "Trade-in" badge and links to its sale.
