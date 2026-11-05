# 0048 — How money is displayed when it is too long for its box

Date: 2026-11-06
Status: Accepted

## Context

Prices here run to tens of billions once the shop is stocked. Long amounts
overflowed cards, pushed table columns off the page and collided with labels at
every window width. Fixed once, at the shared level, not per page.

## Decision

- **One line, tabular, never wrapped.** All money is `whitespace-nowrap` with
  `tabular-nums`. `TableCell` carries these so every table amount is aligned and
  intact; a wide table scrolls inside its own `overflow-x-auto` box and the page
  never scrolls sideways.
- **Exact everywhere a cashier counts.** Tables, receipts, forms, history lists
  and detail sheets always show the full figure. They are never shortened. This
  is the invariant `formatMoney` (unchanged) guarantees.
- **Headline numbers shrink to fit.** Big summary numbers (metric cards) shrink
  to one line via CSS transform (`useFitText`), down to a 0.4 floor that keeps
  the full 13-digit figure (`$9,999,999,999.99`) legible and uncut even in a
  ~120px two-column card at phone width. `MetricCard` does this to any value at
  the root, so pages need no change. There is no shortened form (`19.05M`): it
  was built and removed, because nothing reaches the floor.

## Consequences

- `formatMoney`'s output is unchanged.
- Shrinking uses a transform, so the text stays selectable, accessible and exact.
- If amounts ever outgrow 13 digits in a card, add a short form with the exact
  amount in a tooltip then.
- The app-shell header's fixed-width search box moved to the `lg` breakpoint (a
  search icon stands in below it); it was the one fixed-width flex child that
  overflowed the tablet (768px) layout on every route.
