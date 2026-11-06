# 007 — Step 11, part 5 of 7: receipt printing follows the settings

Status: open · Owner: OpenCode (Big Pickle) · Depends on: 006 (merged)

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
- Model used:
- Commits:
- Files changed:
- Repair ticket, credit contract, shift report: how each is sized, and that it is untouched:
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
- Not done / skipped / failed:

## Check by Claude
