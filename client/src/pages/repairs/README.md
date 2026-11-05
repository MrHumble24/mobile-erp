# page: repairs

The repairs screen (`/repairs`, guard `repair.read`) and the printable ticket
(`/repairs/:id/ticket`). Change 13, ADR 0040. Both redirect to `/` when
`repairsEnabled` is off, so nothing repair shows while the feature is disabled.

## Composes

- `entities/repair` (list, detail, ticket paper, status badge).
- `entities/settings` (the `repairsEnabled` gate + store info for the print).
- Features: `repair-ticket` (new / edit), `repair-status` (transitions),
  `repair-parts` (add / remove), `repair-payment` (payment / refund / outside).

## Pieces

- `RepairsPage` — status chips + date range + server-side search, the table
  (newest first), the "New ticket" button (`repair.manage`), and the detail
  sheet.
- `RepairDetailSheet` — header + status/money actions, money summary, device +
  master meta, parts, payments, warranty (once given back), status history.
- `RepairTicketPage` — the customer's paper copy, printed via `window.print()`.

## Must never

- Render a cost figure the server nulled (no `device.cost.view`).
