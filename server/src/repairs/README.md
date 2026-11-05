# repairs

Repair tickets (Change 13, ADR 0040). Optional, off by default
(`StoreSettings.repairsEnabled`). A phone is taken in for a customer, fixed by
the shop's own master or an outside one, and given back under a per-ticket
warranty. Money in (customer) and out (outside master) flow through the cash
ledger; stock parts flow through `StockService`. Nothing derivable is stored.

## Owns

- `repairs`, `repair_status_history`, `repair_parts`, `repair_payments`, and the
  `repair_statuses` lookup (RECEIVED, IN_REPAIR, READY, GIVEN_BACK, CANCELLED).
- The state machine (`lib/repair-status.ts`) and the derived arithmetic
  (`lib/repair-math.ts`, pure, unit-tested): paid, outstanding, parts cost,
  outside paid, profit, warranty window.

## Exposes (REST `/repairs`)

- `POST /` (`repair.manage`) create; `PATCH /:id` edit while not terminal.
- `GET /` (`repair.read`) paged; `?status&from&to&customerId&search` (ticket
  number / IMEI / serial / customer phone or name). `GET /:id` full ticket.
- `GET /report?from&to` (`repair.read`) income, parts cost, outside cost, profit.
- `POST /:id/status` (`repair.manage`) legal moves only (409 otherwise).
- `POST /:id/parts`, `DELETE /:id/parts/:partId` (`repair.manage`).
- `POST /:id/payments`, `POST /:id/refund`, `POST /:id/outside-payment`
  (`repair.payment`).
- Every route refuses **403 `REPAIRS_DISABLED`** when the setting is off.

## Must never

- Store a passcode / pattern, a passport number, or any ID-document data.
- Store a balance / paid / profit — always sum. Reach into another module's
  repository: parts go through `StockService`, money through `LedgerService`,
  outside-cost reads through `LedgerRepairReadService`.
- Show cost figures (parts/outside/profit) without `device.cost.view`.

## Open questions

- Ticket numbers are retried on a race (single-shop). Printing/receipt layout is
  the client's; the server returns everything a ticket needs.
