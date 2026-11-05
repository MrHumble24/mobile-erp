# pos-terminal

The cashier's POS workspace. Composes the `checkout`, `consign-device` and
`catalog-sell` features (which never import each other) with the device, sale,
catalog, customer, settings and auth slices.

## Owns
- `model/use-pos-terminal.ts` — orchestrator: mode (Sale | Nasiya), input mode
  (Scan | Catalog), settings, cost permission, cart wiring, checkout + receipt
  state, Nasiya consign target, and the catalog pick → cart mapping.
- `model/pos-prefs.store.ts` — the per-browser input-mode preference (persisted).
- `lib/catalog-cart.ts` — maps a picked catalog unit/quantity entry into the
  cart's device / scan-product shape (ADR 0031). The only place catalog and
  device/stock types meet (a widget sees both; sibling entities cannot).
- `model/use-pos-scanner.ts` — resolves any code through `features/scan-code`
  (`GET /scan/:code`, ADR 0030). An IN_STOCK unit is dispatched (add line, or open
  consign in Nasiya); a quantity product is added to the cart (scan again to raise the
  quantity); other unit statuses / unknown codes become a `ScanResult` card.
  `focusScanner()` + `SCANNER_INPUT_ID` for F2.
- `model/use-pos-shortcuts.ts` — global keys.
- UI: `PosTerminal`, `ModeSwitch`, `InputModeSwitch` (Scan ⇄ Catalog),
  `PosScanner`, `ProductSearch` (type-to-find a quantity product by name),
  `ScanResultCard`, `SessionPanel`, `NasiyaPanel`, `CartBar`, `ShortcutsHelp`.
  Catalog mode renders `features/catalog-sell`'s `CatalogBrowser`; both modes feed
  one cart and switching keeps it.

## Layout (ADR 0034)
In Catalog + Sale mode the grid sits on the left and the cart column
(`CartColumn`: lines, level + customer, a whole-cart discount, totals + checkout)
on the right, sticky so the seller never scrolls to pay; the grid shows 5–6 cards
per row on a wide screen. On a narrow window it is one column with a fixed
`CartBar` that shows the amount to pay and jumps to the cart. The cart's price
level is passed into `CatalogBrowser` so the cards show the current level's price.

## Keyboard shortcuts
`F2` focus scanner · `F9` checkout · `Esc` clear scanner · `Ctrl/⌘+Backspace` remove
last line · `F4` customer search · `F8` switch Sale/Nasiya.

## Must never
- Put business rules in `ui/` — those live in the features/entities it composes.
- Let features reach each other; the widget is the only composition point.

## Offline
`features/scan-code` falls back to the synced device cache, then the product
cache, when offline — so both a unit and a quantity product can be found and
sold. Catalog mode draws its grid from the same caches (`entities/catalog`), so
the seller can still tap to sell; pictures not in the cache show the placeholder.
`use-pos-checkout` shows a "queued" toast when checkout enqueues lines.

## Open questions
- SOLD scan links to `/sales` (list), not the exact sale — device lookup has no sale id.
- Session revenue sums the first 100 sales of the day only.
