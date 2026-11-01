# 0008 — Consignment balance and settlement

Date: 2026-11-01
Status: Accepted

## Context

Module 4 (B2B "Nasiya") needs partner balances, a credit limit, and two ways to
resolve a consignment: the partner pays/sells it, or returns it. The database
rules forbid storing derivable facts and channel/profit columns.

## Decision

- **Balance is derived, never stored.** Per partner,
  `outstanding = Σ agreedPrice (status ≠ RETURNED) − Σ partner_payments.amount`,
  with `openCount` (OUT) and `overdueCount` (OUT and past due) computed in one
  SQL aggregate — never a JS loop over rows.
- **Settle creates a Sale carrying `consignmentId`.** Sale channel stays derived
  (`consignmentId` null → retail, else B2B); B2B sales get no Warranty row.
  `landedCostSnapshot` freezes `device.landedCost` at settle time.
- **Credit-limit rule:** on transfer, if `creditLimit > 0` and
  `outstanding + agreedPrice > creditLimit`, reject with 409 and the numbers.
- Resolution is one `$transaction`: consignment + device status/history (+ Sale).
  Device status flips under an optimistic lock (`version`), 409 on mismatch.

## Consequences

- No drift between stored and real balances; reporting reads the same aggregate.
- A SETTLED consignment still counts toward `outstanding` until a payment is
  recorded — the debt clears on payment, not on settle.
- Device/Sale writes temporarily live in the consignments write repository;
  route them through DevicesService/SalesService after the wave-2 merge.
