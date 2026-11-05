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
- **Headline numbers shrink, then — last resort — shorten.** Big summary numbers
  (metric cards, tiles) shrink to fit one line via CSS transform
  (`useFitText`), down to a 0.4 floor that keeps the full 13-digit stress figure
  (`$9,999,999,999.99`) legible and uncut even in a ~120px two-column card at
  phone width. `MetricCard` does this to any value at the root, so pages need no
  change. The shared `Money headline` component goes one step further: below the
  readable floor it switches to a short form (`$19.05M`) with the exact amount in
  a tooltip. `formatMoneyShort` produces that short form.

## Consequences

- `formatMoney`'s output is unchanged; `formatMoneyShort` is additive.
- Shrinking uses a transform, so the text stays selectable, accessible and exact;
  the short form is only reached past the legible floor and always keeps the
  exact figure one hover/tap away.
- The app-shell header's fixed-width search box moved to the `lg` breakpoint (a
  search icon stands in below it); it was the one fixed-width flex child that
  overflowed the tablet (768px) layout on every route.
