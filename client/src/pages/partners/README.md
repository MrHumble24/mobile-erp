# pages/partners

Route `/partners` (needs `partner.read`). B2B partner directory with live
balances, ledger, aging and payments (PRD Module 4).

## Layout

- `PartnersPage` — thin: header + new-partner action (`partner.manage`), owns
  dialog/drawer state, runs `usePartners(queryFilters)`.
- `model/use-partner-filters.ts` — URL-backed filters (search debounced,
  active, overdue only); derives the server `PartnerFilters`.
- `PartnersFilters` — search / status / overdue-only row.
- `PartnersSummary` — tiles derived from the fetched list (partners, devices
  out, outstanding, overdue).
- `PartnersTable` → credit-usage bar + aggregates; row opens the drawer.
- `PartnerLedgerDrawer` → `PartnerAging` (buckets) + interleaved ledger with
  running balance; actions record payment, edit, or start a consignment
  (pre-selecting this partner, `lockPartner`).
- `CreatePartnerDialog` / `EditPartnerDialog` — `partner.manage` forms.

## Never

Import another page. Call `useQuery` here (entity hooks only). Render native
form/table controls. Author Uzbek copy.
