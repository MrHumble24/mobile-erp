# features/print-price-tags

The one user action "print shelf price tags" for the phones and quantity goods
on the current page (ADR 0043).

## Owns

- `PriceTagsDialog` — tick the rows to print (the page's `preselected` rows at
  first), select all / clear, a live count, an on-screen preview and a **Print**
  button that calls `window.print()`.
- `PriceTagSheet` — what is actually printed: only the ticked items, three tags
  across, in the `.printable-tags` container (A4, named page `price-tags`).
- `PriceTag` — one label: title, optional subtitle, price via `formatMoney`,
  and `BarcodeVisual` when the row has a code. A tag never splits across pages.

## Public API (`index.ts`)

- Type `PriceTagItem` — `{ id, title, subtitle, price, code, preselected }`.
- `PriceTagsAction` — `{ items }`; renders the button and dialog only while
  `priceTagsEnabled`.
- `PriceTagsDialog` — `{ items, open, onOpenChange }`.

## Must never

- Know about devices or stock — the page maps its rows into `PriceTagItem[]`.
- Fetch data, import another feature, or call `window.print()` on render.

The printed copy is rendered through a portal straight under `<body>` (hidden on
screen); the grid inside the dialog is only a preview. Inside the dialog the
sheet would be cut off at the dialog's height on paper. While the printed copy
is mounted the print styles lay out nothing else, so labels flow over pages.
