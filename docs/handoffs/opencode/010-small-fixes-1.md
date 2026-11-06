# 010 — Small fixes: missing pictures and price tag defaults

Status: merged · Owner: OpenCode (Big Pickle) · Depends on: nothing

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
- Model used: Big Pickle (opencode/big-pickle)
- Commits: 90b4594 `fix(client): asset image fallback and price tag preselection`; this handoff commit follows.
- Files changed:
  - `client/src/shared/ui/asset-image.tsx` — shows the existing placeholder on `onError`, and resets the failed source when `path` changes so the new picture is tried.
  - `client/src/shared/ui/README.md` — one line: fallback also on load failure, new path retried.
  - `client/src/features/print-price-tags/model/price-tag.types.ts` — added `preselected: boolean`.
  - `client/src/features/print-price-tags/ui/PriceTagsDialog.tsx` — initial selection is the `preselected` rows; Select all / Clear unchanged.
  - `client/src/features/print-price-tags/README.md` — one line: dialog starts from the page's `preselected` rows; type gains `preselected`.
  - `client/src/pages/inventory/lib/device-price-tags.ts` — `preselected` only for `IN_STOCK`; subtitle joins only the parts that exist (no dash).
  - `client/src/pages/inventory/lib/device-price-tags.spec.ts` — in-stock preselected, sold not; subtitle both / storage only / color only / neither.
  - `client/src/pages/stock/lib/product-price-tags.ts` — `preselected` only when `quantity > 0`.
  - `client/src/pages/stock/lib/product-price-tags.spec.ts` — stock > 0 preselected, zero not.
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
  - `pnpm install`: `Already up to date` / `Done in 1ms using pnpm v12.16.1`
  - `pnpm test`: `ℹ tests 104` · `ℹ pass 104` · `ℹ fail 0` · `ℹ skipped 0`
  - `pnpm lint`: `$ oxlint` — exit 0; 117 pre-existing warnings elsewhere in `client`, none in the touched files.
  - `pnpm build`: `vite v8.3.5 building client environment for production...` · `✓ built in 6.56s` · PWA precache 159 entries.
  - `graphify update .` ran in `client/` and at the repo root (rebuilt both graphs; outputs are gitignored).
- Not done / skipped / failed:
  - No component test for `AssetImage`: this repo has no component test framework (tests are `node:test` for pure functions only).
  - Screens were not seen: no browser is available in this environment. Claude checks the UI.
  - Nothing failed; no new i18n text was needed.

## Check by Claude
- 2026-11-06: checked and merged. Committed properly, report accurate. After merging `main`:
  105 website tests pass, lint 0 errors, build passes.
- Seen in a browser, with the server's pictures folder emptied on purpose: the till's catalog
  shows the placeholder for every missing picture and no broken-image mark. On the inventory
  page (36 phones, 11 in stock) the price tags dialog opens with 11 ticked and 11 labels to
  print; a phone with storage only reads "128", no dash.
- Not seen: the stock page's dialog with a zero-stock product (unit test only).
