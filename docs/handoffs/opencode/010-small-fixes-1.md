# 010 — Small fixes: missing pictures and price tag defaults

Status: open · Owner: OpenCode (Big Pickle) · Depends on: nothing

## Why
Three small things found while checking other work on 2026-11-06:
- A product picture whose file is missing shows the browser's broken-image mark (seen on the
  public shop page). `AssetImage`'s own comment says it falls back when the picture fails to load,
  but the code only falls back when there is no path at all.
- The price tags dialog ticks every row on the page, sold phones included. Nobody prints a shelf
  label for a phone that is gone.
- A label for a phone with storage but no color reads "128 · -".

=== MESSAGE ===
Three small fixes on the website. Website only: `client/**`. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/small-fixes-1`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding (Feature-Sliced Design, one component per file, files ≤300 lines, shadcn components from `shared/ui`, no new dependency). Then read `client/src/shared/ui/asset-image.tsx`, `client/src/features/print-price-tags/` (all of it), `client/src/pages/inventory/lib/device-price-tags.ts` and its spec, `client/src/pages/stock/lib/product-price-tags.ts` and its spec.

1. `client/src/shared/ui/asset-image.tsx`: when the picture fails to load, show the same placeholder that is shown when there is no path. Keep one component in the file and keep it the only place in the app with a native `<img>`. When `path` changes to another picture, the failed state must not stick: the new picture gets its own try. Do not change the props. No test framework for components exists here, so no test for this one; say so in the Result.

2. Price tags, what is ticked at first:
   - `PriceTagItem` (`features/print-price-tags/model/price-tag.types.ts`) gets one more field, `preselected: boolean`: whether the row is ticked when the dialog opens.
   - `devicesToPriceTags`: `preselected` is true only when the device's `statusCode` is `IN_STOCK`.
   - `productsToPriceTags`: `preselected` is true only when the row has stock above zero. Read `StockLevelView` in `client/src/entities/stock` for the right field; do not guess its name.
   - `PriceTagsDialog.tsx`: the first selection is the rows with `preselected` true. "Select all" still ticks every row; "Clear" still unticks every row. The feature still knows nothing about devices or stock.
   - Update the two spec files: a phone in stock is preselected; a sold phone is not; a product with stock is preselected; a product with zero stock is not.

3. Price tags, the second line of a phone's label (`device-price-tags.ts`): show only the parts that exist. Storage and color: `256gb · white`. Storage only: `128`. Color only: `white`. Neither: no second line (null), as today. Never a dash for a missing part. Update the spec: one case for each of the four.

Text: no new text is needed. If you find you need one, add the key to the existing `inventory.json` in `en` and the same English text in `uz`; do not write Uzbek.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Update `client/src/features/print-price-tags/README.md` and `client/src/shared/ui/README.md` in a line each where the behaviour changed. Then commit on this branch, adding files by path (never `git add -A`): the code, then the handoff. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/010-small-fixes-1.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used:
- Commits:
- Files changed:
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
- Not done / skipped / failed:

## Check by Claude
