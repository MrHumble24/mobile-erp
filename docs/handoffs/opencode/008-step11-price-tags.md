# 008 — Step 11, part 6 of 7: price tags

Status: done · Owner: OpenCode (Big Pickle) · Depends on: 007 (merged)

## Why
Part 6 of the step 11 website work. Settings has a "Print price tags" switch (part 1) that does
nothing yet. When it is on, staff must be able to print small tags for the phones and goods on the
shelf: name, storage and color, price, and the code as a barcode.

=== MESSAGE ===
Add price tag printing to the website. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-price-tags`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design, one component per file, files ≤300 lines, shadcn components from `shared/ui`, no native form elements, no new dependency). Then read `client/src/entities/settings/model/use-print-settings.ts`, `client/src/shared/ui/barcode-visual.tsx`, the `@media print` block near the end of `client/src/app/styles/index.css`, `client/src/pages/inventory/ui/DevicesTab.tsx` and `DeviceListSection.tsx`, and `client/src/pages/stock/ui/StockPage.tsx` and `StockTable.tsx`.

Do this:
1. A new feature slice `client/src/features/print-price-tags/` (with `index.ts` and a `README.md`):
   - `model/price-tag.types.ts`: `PriceTagItem { id: string; title: string; subtitle: string | null; price: number | string | null; code: string | null }`. The feature knows nothing about devices or stock; the pages build these items.
   - `ui/PriceTagsDialog.tsx`: a dialog that gets `items: PriceTagItem[]`. It lists them with a checkbox each (all ticked at first), "select all" and "clear", shows how many are ticked, and has a Print button that is disabled when none is ticked. Print calls `window.print()` and nothing else; never call it at import time or in a test.
   - `ui/PriceTagSheet.tsx`: what is printed, the ticked items only, in a container with the class `printable-tags`: a grid of three tags across. `ui/PriceTag.tsx`: one tag: the title, the subtitle when there is one, the price in large type with `formatMoney` (left out when the price is null), and `BarcodeVisual` with the code and the code as text under it (left out when the code is null). One tag never breaks across two pages.
2. Print styles in `client/src/app/styles/index.css`, inside the existing `@media print` block, without changing any existing rule: when a `.printable-tags` element is on the page it is the only thing printed, on A4 with a small margin. Use a named page so receipts keep their own size:
   ```css
   .printable-tags, .printable-tags * { visibility: visible !important; }
   .printable-tags { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; page: price-tags; }
   @page price-tags { size: A4; margin: 8mm; }
   ```
   On screen the sheet is shown inside the dialog as a preview.
3. Devices: on the inventory devices tab add a "Price tags" button next to the existing actions. It opens the dialog with the rows now shown in the list (the current page, after filters). Title: brand and model name. Subtitle: storage and color, taken the way the row already shows them. Price: the price the row already shows. Code: the IMEI, or the serial number when there is no IMEI.
4. Quantity goods: the same button on the stock page, with the rows now shown. Title: the product name. Subtitle: none. Price: the sale price the row shows. Code: the product's barcode when the row has one, otherwise none.
5. Both buttons are shown only when `usePrintSettings().priceTagsEnabled` is true. With the switch off the two pages look exactly as they do now.
6. A page must not import another page, and a feature must not import another feature. The pages build the `PriceTagItem[]`; put each mapping in a small pure function in the page's `lib/` and test it with `node --test` (a phone with IMEI, storage and color; a unit with only a serial number; a product without a barcode; a row without a price). Add the spec files to the `test` script in `client/package.json`.
7. The React Compiler is on: read a form value with `useWatch`, never `form.watch`.
8. Text: new keys go into the existing `client/src/shared/i18n/en/inventory.json`, and the same keys with the same English text into `uz/inventory.json`. Do not create a new i18n file. Do not write Uzbek. No raw key may show on screen.
9. Update the READMEs of `pages/inventory` and `pages/stock` in a line each.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Then commit on this branch, adding files by path (never `git add -A`): the code, then the handoff. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/008-step11-price-tags.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser or a print preview, so say plainly that neither was seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used: Big Pickle (`opencode/big-pickle`).
- Commits: `55fc6c7` feat(client): add price tag printing; this handoff is committed separately on the same branch.
- Files changed:
  - `client/src/features/print-price-tags/` (new slice: types, dialog, sheet, tag, action, README, index).
  - `client/src/pages/inventory/lib/device-price-tags.ts` + spec.
  - `client/src/pages/stock/lib/product-price-tags.ts` + spec.
  - `client/src/pages/inventory/ui/DevicesTab.tsx`, `InventoryFilters.tsx`, README.
  - `client/src/pages/stock/ui/StockPage.tsx`, README.
  - `client/src/app/styles/index.css` (added print rules only).
  - `client/src/shared/i18n/{en,uz}/inventory.json` (same English keys in both).
  - `client/package.json` (two spec files added to `test`).
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
  - `pnpm install`: `Already up to date` / `Done in 2ms using pnpm v12.16.1`.
  - `pnpm test`: `tests 90` · `pass 90` · `fail 0` · `cancelled 0` · `skipped 0` · `todo 0` (includes the six new price-tag assertions).
  - `pnpm lint`: exit 0; warnings only, all pre-existing. No lint finding in any file added or changed by this task.
  - `pnpm build`: `✓ built in 5.60s`; PWA precache 153 entries.
- Graph: `graphify update .` ran in `client/` (3458 nodes, 10717 edges) and at the repo root (13485 nodes, 26565 edges). Root skipped `graph.html` because the graph exceeds the 5000-node visualisation limit.
- Docs touched: `client/src/features/print-price-tags/README.md`, `client/src/pages/inventory/README.md`, `client/src/pages/stock/README.md`, this handoff.
- Not done / skipped / failed:
  - The browser and the print preview were **not opened** by this agent; Claude checks them.
  - Nothing else failed or was skipped.

## Check by Claude
