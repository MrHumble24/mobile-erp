# Features/Consignment

The Partners & Consignment slice group (PRD Module 4), iOS port of the web
`pages/partners`, `pages/consignments` and the consign/settle/return/payment
features. One slice folder, two nav modules (they share the consign writer,
the partner picker and the lifecycle, so splitting would duplicate money-path
logic or force a forbidden cross-slice import).

## Public API (what the integrator wires)
- `PartnersModule.feature` — nav `partners`, `partner.read`.
- `ConsignmentsModule.feature` — nav `consignments`, `consignment.read`.
Add both to `FeatureRegistry.all`. Nothing else in `App/` changes.

## What it owns
- Partner directory from the **offline mirror** (balances) or `/partners`
  online (counts/flags); search / active / overdue filters; summary tiles.
- Partner detail: ledger + aging (online), and permission-gated actions —
  record payment (`partner.payment`), edit (`partner.manage`), new
  consignment (`consignment.create`).
- Partner create/edit + record payment: **online-only**, blocked offline.
- Consignments list/stats (online), detail, pagination, period/status/search
  filters, pending-sync marker.
- Consign / settle / return: **offline-capable** via `ConsignmentWriter`
  (outbox types `consignment.create|settle|return`, optimistic device-status
  update, device-version base lock). Online-first, queues on network loss.

## Must never
- Import another feature slice, edit `App/`, the shell, foundation or the
  SwiftData schema. Author Uzbek copy (uses web i18n via `t()`).
- Queue anything but the three consignment types; every other write gates on
  `connectivity.isOnline`.

## Notes
- `PartnerRepository.update` issues its PATCH through the shared `container.api`
  (`patchVoid`); no slice-local HTTP client.
- DEBUG self-check: `consignmentSelfCheck()` (overdue + period bounds), run
  from `ConsignmentsView.task`.
