# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Three clients, one product: `client/` is the desktop web terminal (React, shadcn
"Caldera" kit in `shared/ui`), `mobile/android` (Kotlin, Compose) and `mobile/ios`
(SwiftUI) are native apps sharing the Ink theme (ADR 0020, token source
`docs/design/mobile-themes/theme-01-ink.html`). Slice and screen names match across
all three so a change is traceable everywhere.

## Users

- **Store Owner (Admin)** of a phone-retail stall in the Malika Bazaar electronics
  market, Tashkent. Sees costs, margins, partner debt, expenses, Telegram alerts.
  Buys batches abroad (mostly South Korea) and needs to know what each unit truly cost.
- **Cashier / Store Manager (POS Operator)** at the counter during peak hours. Scans
  IMEIs, checks out walk-in customers, consigns devices to partner stalls, verifies
  warranty. Cannot see acquisition cost or profit unless the owner grants it.
- **Inventory / QC Specialist** receiving shipments: registers batches, scans every
  IMEI in, grades condition, flags defects.
- Roles are data, not code (permission matrix, ADR 0003); the three above are seeded
  defaults, so the UI must never hard-code a role name.

Situation: a crowded bazaar booth, intermittent internet, a USB or Bluetooth barcode
scanner acting as a keyboard, a thermal receipt printer, speed over everything.

**Mobile apps (user-confirmed):** a full POS replacement on a phone, usable as the only
terminal in a small booth. Every web workflow, including checkout, has to work there,
not just lookup or dashboards.

## Product Purpose

Track every device from international procurement through QC, stock, B2C sale or B2B
consignment ("Nasiya") to settlement, with real profit per unit and a daily Telegram
digest to the owner. Single-tenant custom build for one store; not SaaS. Success is a
cashier completing a scan-to-receipt sale in seconds, zero double-sold IMEIs, and the
owner trusting the margin numbers.

## Positioning

Local-first ERP built around the bazaar's own practices: IMEI state-locking across
terminals during outages, partner consignment with ledgers and aging, landed-cost
allocation per batch. Generic POS products do not model Nasiya or Korean batch
procurement. Uzbek is the primary UI language, written in merchants' own terms
(`client/src/shared/i18n/GLOSSARY.md`).

## Operating Context

- Workflow: procurement batch → IMEI intake scan → QC → In Stock → B2C checkout or
  consignment → Sold / Returned → analytics and Telegram alerts (`docs/PRD.md` §3).
- Offline-first on every client: IndexedDB + outbox on web (ADR 0018), Room / SwiftData
  mirrors on mobile (ADR 0016), server reconciliation with admin-resolved conflicts
  (ADR 0011). The UI must always show sync state and conflict prompts.
- Hardware: HID barcode scanners (web and mobile fallback), camera scanning on mobile
  (ML Kit / VisionKit), thermal receipt and label printers.
- Single currency, no exchange rates. Money is `Decimal(14,2)`.
- Device identity: 15-digit IMEI, optional IMEI 2 for dual-SIM (ADR 0021).
- Statuses: In Stock, Defective, Consigned, Sold (lookup tables, never enums).
- Uzbek copy and UI wording are produced by Gemini via `docs/handoffs/gemini/`; Claude
  agents never hand-write Uzbek.

## Capabilities and Constraints

Web routes (all implemented): login, dashboard, inventory, shipments, qc, pos, sales,
customers, partners, consignments, expenses, reports, users, settings, sync. Mobile
mirrors these per ADR 0016.

Constraints future work must keep:
- Cost and margin data are redacted for users without `device.cost.view`; no screen may
  leak them through layout, tooltips, or cached feeds.
- Checkout is idempotent and snapshots cost (ADR 0007); offline mutations replay in
  order (ADR 0011).
- Three-client parity: a feature or screen added to one client is expected on the other
  two with matching slice names.
- Desktop web is keyboard-shortcut and scanner driven; mobile follows the 40 dp touch
  target floor in ADR 0020.
- File-size and FSD rules in `.agent/rules/` bind every UI change.

Undecided:
- The store name is inconsistent in code: "Malika ERP" (web title), "MALIKA SMARTPHONES"
  (receipt header), "Malika Bazaar" (Android app name). The owner names the store
  "T-Mobile" (see Brand Commitments); the three code strings have not been reconciled.

## Brand Commitments

- Store name, user-stated: **T-Mobile**. This is the bazaar stall's trading name and is
  not the telecom carrier. Never reuse the carrier's wordmark, magenta, or trade dress;
  design a neutral treatment of the name. Product name in code remains "Malika ERP".
- No logo exists. Only `client/public/favicon.svg` and `client/public/icons.svg`. Do not
  invent a logo; treat it as an asset the owner must supply.
- Mobile visual identity: Warm Card, chosen 2026-11-03 to replace Ink (ADR 0022
  proposed, supersedes 0020); the system of record is `DESIGN.md`. Shared tokens on
  both platforms, platform-specific component anatomy. Web uses the Caldera shadcn kit
  (`docs/COMPONENTS.md`).
- Voice: practical, terse, merchant-facing Uzbek; English is the developer fallback.

## Evidence on Hand

- Requirements: `docs/PRD.md`; decisions: `docs/decisions/0001`–`0021`.
- Mobile theme mocks: `docs/design/mobile-themes/`.
- Component kit docs: `docs/COMPONENTS.md`; i18n: `client/src/shared/i18n/{uz,en}`.
- Dev users `owner|cashier|qc@malika.uz` (passwords in `server/.env`, never in docs).
- Absent, must not be fabricated: customer testimonials, sales figures, partner names,
  pricing claims, store photos.

## Product Principles

1. Speed at the counter beats completeness: scan, confirm, done.
2. Offline is the normal state, not an error state.
3. Never show a number the role is not allowed to see.
4. One behaviour, three clients: parity by slice name.
5. The merchant's vocabulary, not the developer's.

## Accessibility & Inclusion

High-contrast, keyboard-operable desktop UI for peak-hour use (PRD §5). Mobile:
40 dp minimum touch targets, system light/dark both supported (ADR 0020). Uzbek first,
English fallback. No further standard has been set.
