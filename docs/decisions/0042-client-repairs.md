# 0042 — Client repairs slice and optional-feature gating

Date: 2026-11-05
Status: Accepted

## Context

Web client for repairs (Change 13, server ADR 0040). Repairs is optional
(`StoreSettings.repairsEnabled`, off by default) and every `/repairs` route
403s `REPAIRS_DISABLED` when off. Unlike earlier optional features (shifts,
customer credit), the task requires repairs to be **invisible everywhere** while
off — nav item, routes, report tab, customer-detail section — not just inert.

## Decision

- FSD layout: `entities/repair` (types, repository, keys, query + mutation
  hooks, pure `repair-status` / `repair-math` / `repair-error` libs, base
  `RepairStatusBadge` + `RepairTicketPaper`); four features
  (`repair-ticket`, `repair-status`, `repair-parts`, `repair-payment`), each one
  user action, composed by `pages/repairs`.
- First setting-gated navigation: `NavItemDef.requiresSetting?: "repairsEnabled"`
  filtered in the sidebar against `useSettings()`. Routes and the report tab and
  the customer-detail list read the same flag; `RepairsPage` /
  `RepairTicketPage` `Navigate` to `/` when it is off, so a direct URL is dead
  too. The command palette simply omits repairs (it is a curated subset).
- No print endpoint exists (unlike credit's contract): `RepairTicketPaper` is
  built client-side from `RepairView` + store settings.
- Cost figures (`partsCost` / `outsidePaid` / `profit` / part costs) are only
  rendered when the server returns non-null — never a fake 0.

## Consequences

- A reusable pattern: any future optional feature hides fully via
  `requiresSetting` + an in-page settings guard.
- English i18n keys live in a new `repairs` namespace; Uzbek is pending Gemini.
