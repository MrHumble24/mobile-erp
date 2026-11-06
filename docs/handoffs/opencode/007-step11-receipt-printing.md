# 007 — Step 11, part 5 of 7: receipt printing follows the settings

Status: merged · Owner: OpenCode (Big Pickle) · Depends on: 006 (merged)

## Why
Part 5 of the step 11 website work. The Settings page (part 1) has "Print receipts" and a paper
width (58 or 80 mm), but nothing reads them: the Print button is always there and the receipt is
always 58 mm. The receipt also prints a shop name and address typed into the code, although the
server now sends the real ones. Price tags were split off into their own part (008), and the
buy-back messages are part 009, so the step now has 7 parts.

=== MESSAGE ===
Make the sale receipt follow the printing settings and print the shop's real name. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-receipt-printing`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design, one component per file, files ≤300 lines, shadcn components from `shared/ui`, no new dependency). Then read `docs/decisions/0043-bonus-points.md` (the printing part), `server/src/sales/types/sale.types.ts` (the receipt view: `store` and `receiptFooter`), `client/src/entities/sale/ui/ReceiptPrintView.tsx`, `client/src/features/checkout/ui/CheckoutReceiptModal.tsx`, `client/src/pages/sales/ui/SaleReceiptPage.tsx`, `client/src/pages/sales/ui/SaleReceiptDialog.tsx`, and the `@media print` block near the end of `client/src/app/styles/index.css`.

Do this:
1. Split first. `entities/sale/ui/ReceiptPrintView.tsx` is 284 lines and holds twelve components. Give each its own file in a new folder `client/src/entities/sale/ui/receipt/` (one component per file, file name = component name). `BarcodeVisual` knows nothing about sales: move it to `client/src/shared/ui/barcode-visual.tsx` and export it from `shared/ui/index.ts`; part 6 will reuse it. The entity's `index.ts` keeps exporting `ReceiptPaper` and `ReceiptPrintView` under the same names. No behaviour changes in this step.
2. The shop on the receipt. Add `store: { name, address, phone }` and `receiptFooter` to the client's receipt type exactly as the server sends them. The receipt header prints the store's name, address and phone from `receipt.store`; a line whose value is null is left out. Remove the shop name and address typed into the code. At the bottom, print `receipt.receiptFooter` when it is not null, in place of the web address typed into the code. The Telegram text (`entities/sale/lib/format-receipt.ts`) uses the same store name.
3. A hook for the three printing settings: `client/src/entities/settings/model/use-print-settings.ts`, `usePrintSettings()` → `{ receiptPrintingEnabled, receiptPaperWidthMm, priceTagsEnabled }`, built on the existing settings query; while the settings are loading: `false`, `80`, `false`. Export it from the entity's `index.ts`.
4. `ReceiptPrintView` and `ReceiptPaper` get two props, `paperWidthMm: 58 | 80` and `canPrint: boolean`; they do not read settings themselves. The three callers (`CheckoutReceiptModal`, `SaleReceiptPage`, `SaleReceiptDialog`) read `usePrintSettings()` and pass them.
   - `canPrint` false: no Print button anywhere, no "print automatically" switch, and the automatic print never fires. "Copy for Telegram" stays.
   - `canPrint` true: as today.
5. Paper width. The receipt box gets `data-paper="58"` or `data-paper="80"` and is that wide on screen (replace the fixed `sm:w-[58mm]`). In `app/styles/index.css` keep every existing print rule as it is (58 mm stays the default) and add only the 80 mm case:
   ```css
   .printable-cheque[data-paper="80"] { width: 80mm !important; max-width: 80mm !important; page: receipt-80; }
   @page receipt-80 { size: 80mm auto; margin: 0; }
   ```
   inside the existing `@media print` block (the `@page` rule next to the existing one).
6. Do not change how the repair ticket (`pages/repairs/ui/RepairTicketPage.tsx`), the credit contract (`pages/credits/ui/CreditContractPage.tsx`) and the shift report (`features/manage-shift/ui/ShiftReportDialog.tsx`) print. Read how each is sized and say in the Result that it is untouched.
7. Never call `window.print()` in a test or at import time.
8. Text: any new key goes into the existing `sales.json` or `pos.json` under `client/src/shared/i18n/en/`, and the same key with the same English text under `uz/`. Do not create a new i18n file. Do not write Uzbek. No raw key may show on screen.
9. Update `client/src/entities/sale/README.md` and `client/src/entities/settings/README.md` (if it exists) in a few lines, and `client/src/shared/ui/README.md` for `BarcodeVisual`.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Then commit on this branch, adding files by path (never `git add -A`): first the split (step 1) as its own commit, then the rest, then the handoff. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/007-step11-receipt-printing.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser or a print preview, so say plainly that neither was seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used: OpenCode — Big Pickle.
- Commits:
  - `f221cba` refactor(sale): split receipt UI into one component per file
  - `dbc3eed` feat(sale): receipt follows print settings and prints the real shop
- Files changed:
  - Split: `entities/sale/ui/receipt/` (`ChequeActions`, `ChequeBonusLine`,
    `ChequeDiscount`, `ChequeHeader`, `ChequeItems`, `ChequeMeta`, `ChequePayments`,
    `ChequeTradeIns`, `ChequeWarranty`, `ItemIdentity`, `ReceiptPaper`,
    `ReceiptPrintView`), old `ui/ReceiptPrintView.tsx` removed; `BarcodeVisual`
    moved to `shared/ui/barcode-visual.tsx` and re-exported from `shared/ui/index.ts`.
  - Receipt data: `entities/sale/model/sale.types.ts` (`store`, `footer`),
    `entities/sale/ui/receipt/ChequeHeader.tsx`, `ReceiptPaper.tsx`,
    `entities/sale/lib/format-receipt.ts`, `entities/sale/lib/combine-receipts.ts`.
  - Print settings: new `entities/settings/model/use-print-settings.ts`, exported
    from `entities/settings/index.ts`; callers `CheckoutReceiptModal`,
    `SaleReceiptPage`, `SaleReceiptDialog` pass `paperWidthMm` + `canPrint`.
  - Paper width: `ReceiptPaper` sets `data-paper` and the matching screen width;
    `app/styles/index.css` keeps all existing print rules and adds only the 80 mm
    rule plus `@page receipt-80`.
  - Docs: `entities/sale/README.md`, `shared/ui/README.md`, and a new
    `entities/settings/README.md` (the file did not exist before).
- Repair ticket, credit contract, shift report: how each is sized, and that it is untouched:
  - Repair ticket: `RepairTicketPaper` uses `.printable-cheque w-full max-w-[520px]`
    with a `print:hidden` toolbar. Untouched.
  - Credit contract: `ContractPaper` uses `.printable-cheque w-full max-w-[520px]`
    with a `print:hidden` toolbar. Untouched.
  - Shift report: `ShiftReportView` uses `.printable-cheque w-full max-w-[340px]`
    inside the dialog with `print:hidden` header/button. Untouched.
  - None of them sets `data-paper`, so the new 80 mm rule does not apply; all keep
    the existing 58 mm print default.
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
  ```
  ℹ tests 84
  ℹ suites 0
  ℹ pass 84
  ℹ fail 0
  ℹ cancelled 0
  ℹ skipped 0
  ℹ todo 0
  ℹ duration_ms 156.048
  $ oxlint
  ... existing max-lines-per-function / set-state-in-effect warnings across the repo ...
  $ tsc -b && vite build
  ✓ built in 5.98s

  PWA v2.0.0
  mode      generateSW
  precache  151 entries (3194.33 KiB)
  files generated
    dist/sw.js
    dist/workbox-9c191d2f.js
  ```
  `pnpm lint` exited 0 (warnings only, none in the changed receipt files).
- Graph: `graphify update .` ran in `client/` (3426 nodes, 10633 edges) and at
  the repo root (13419 nodes, 26452 edges); the root run skipped `graph.html`
  because the graph exceeds its 5000-node visualisation limit.
- Not done / skipped / failed:
  - Neither a browser nor a print preview was opened/seen (not available here);
    Claude must check the rendered receipt and the 58/80 mm print result.
  - The server receipt field is `footer`, not `receiptFooter` (see
    `server/src/sales/types/sale.types.ts` and `sales-read.service.ts`). The client
    type and UI use `footer` so the real value renders; no server file was edited.
  - No new i18n keys were needed; no raw key was added to the screen.

## Check by Claude
- 2026-11-06: checked and merged. Committed in the order asked (split first), report accurate.
  Tests 84 pass, lint 0 errors, build passes. It read the server and used the real field name
  `footer` where the handoff wrongly said `receiptFooter`.
- Seen in a browser on a real sale: the header is the store's own name ("MAIN STORE"), no
  "Malika" anywhere on the receipt; with 58 mm the paper has `data-paper="58"` and is 219 px
  wide, with 80 mm `data-paper="80"` and 302 px; with printing off there is no Print button and
  "Copy for Telegram" stays. Settings were put back to on / 58 mm.
- Not seen: a real print preview (clicking Print opens a dialog that blocks the browser tools),
  the automatic print after a sale, the Telegram text.
