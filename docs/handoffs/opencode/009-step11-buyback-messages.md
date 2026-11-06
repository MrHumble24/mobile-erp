# 009 — Step 11, part 7 of 7: buy-back and return messages, and the ADR for the step

Status: merged · Owner: OpenCode (Big Pickle) · Depends on: 008 (merged)

## Why
The last part of the step 11 website work. The server can now buy back a phone the shop sold
(ADR 0044), and refuses some returns and trade-ins with a code. The website shows the server's
English sentence as it is, or a general "conflict" line, so an Uzbek-speaking cashier gets an
English error. This part gives each refusal its own translated message, and writes down the
decisions of the whole step in one ADR.

=== MESSAGE ===
Give the server's refusals around buy-back, returns and trade-in their own translated messages, and write the ADR for step 11 on the website. Website only: `client/**` and docs. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/opencode/step11-buyback-messages`, stop and say so. Work only in this folder. Never commit to `main`, never push.

Read `CLAUDE.md` and every file in `.agent/rules/` first. They are binding. Then read `docs/decisions/0039-customer-purchases-and-trade-in.md`, `0043-bonus-points.md`, `0044-buy-back-of-a-sold-unit.md`, and these files: `client/src/shared/api/http.ts` (`HttpError`), `client/src/features/checkout/lib/checkout-error.ts`, `client/src/entities/backup/` (how it reads an error's code), `client/src/features/buy-phone/ui/BuyPhoneDialog.tsx`, `client/src/features/warranty-lookup/ui/ReturnSaleDialog.tsx`, and where the till shows a failed checkout (`client/src/widgets/pos-terminal/model/use-pos-checkout.ts`).

The server's codes (they arrive as `code` in the error body):
- on a return: `SALE_UNIT_BOUGHT_BACK` (the phone of this sale was bought back since, so the sale cannot be returned), `TRADE_IN_REFUND_FORBIDDEN` (this sale had a trade-in and the user may not pay its value back);
- on a sale with a trade-in: `TRADE_IN_FORBIDDEN`, `TRADE_IN_NO_CUSTOMER`, `TRADE_IN_OFFLINE`, `TRADE_IN_EXCEEDS_SALE`;
- on buying a phone from a customer: a 409 when the IMEI or serial belongs to a unit that is in stock, consigned, defective or returned (only a unit that was SOLD can be bought back). Read `server/src/customer-purchases/` for the exact code or message it sends; do not guess.

Do this:
1. One place to read a server error's code. Today the same few lines exist in more than one slice. Put one small function in `client/src/shared/api/http.ts` (for example `httpErrorCode(err): string | undefined`) and use it in the checkout error helper, the backup entity and the places below. Remove the copies.
2. Returns (`ReturnSaleDialog.tsx`): show a clear translated message for `SALE_UNIT_BOUGHT_BACK` and for `TRADE_IN_REFUND_FORBIDDEN`; any other 409 keeps today's behaviour. Put the code-to-key mapping in a small pure function in the slice's `lib/` and test it.
3. Buying a phone (`BuyPhoneDialog.tsx`): a translated message for the refusal of a unit that is not sold; and, when the purchase succeeds for a phone the shop sold before, the success message says so ("bought back; it is in stock again"). Find in the server's answer how a buy-back can be told from a first purchase; if the answer does not say, write that in the Result and keep the normal success message.
4. Trade-in at the till: the four `TRADE_IN_...` codes get translated messages through the same helper the `BONUS_...` codes use (`features/checkout/lib/checkout-error.ts`). Add them to its test.
5. No website check may block an IMEI just because the shop sold it before. Search `features/buy-phone`, `features/checkout` (trade-in) and `features/scan-code` for such a check and remove it if it exists; say what you found.
6. Text: new keys go into the existing `sales.json`, `purchases.json` and `pos.json` under `client/src/shared/i18n/en/`, and the same keys with the same English text under `uz/`. Do not create a new i18n file. Do not write Uzbek. No raw key and no English server sentence may show for these cases.
7. The ADR: `docs/decisions/0047-client-bonus-printing-buyback.md`, at most 40 lines, in the format of the other ADRs (Date, Status, Context, Decision, Consequences). It records what parts 1 to 7 decided on the website: the settings switches; points are shown with `formatNumber`, never as money; the points plan sits on top of the trade-in plan and is shared out over the cart's lines; a sale with points or a trade-in is never queued offline; one source for the receipt's points lines; the receipt takes the shop's name from the server and follows the paper width and the printing switch; price tags are built by the pages and printed by one feature; server refusals are shown by code. Read the Result and "Check by Claude" sections of `docs/handoffs/opencode/003` to `008` for the facts; do not invent any.
8. Update the READMEs of the slices you changed, a line each.

Checks. Run them and paste the real output:
```
cd client && pnpm install && pnpm test && pnpm lint && pnpm build
```
Then `graphify update .` in `client/` and at the repo root (if the command is missing, say so).

Then commit on this branch, adding files by path (never `git add -A`): the code, the ADR, then the handoff. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/opencode/009-step11-buyback-messages.md`, set Status to done, and commit that too. Report only what you ran. You cannot open a browser, so say plainly that the screens were not seen; Claude checks them. If something failed or was skipped, say so.
=== END ===

## Result (OpenCode fills)
- Model used: Big Pickle (`opencode/big-pickle`).
- Commits: `59ce34c` — `feat(client): show buy-back, return and trade-in refusals by code`
  (code, tests, READMEs, ADR 0047). This handoff is committed separately.
- Files changed:
  - `shared/api/http.ts` — `httpErrorCode(err)` reads a server `code` once; the
    `API_BASE_URL` read was made safe for the node tests.
  - `features/checkout/lib/checkout-error.ts` — `checkoutErrorKey` now reads the
    code itself and maps the four `TRADE_IN_*` codes; spec added.
  - `features/checkout/model/use-checkout.ts`, `widgets/pos-terminal/model/use-pos-checkout.ts`
    — use the shared code reader / the updated helper.
  - `entities/backup/lib/backup-error.ts`, `entities/repair/lib/repair-error.ts`,
    `entities/shift/lib/no-open-shift.ts` — the copied `data.code` reads removed.
  - `features/warranty-lookup/lib/return-error.ts` + spec, `ui/ReturnSaleDialog.tsx`
    — `SALE_UNIT_BOUGHT_BACK` and `TRADE_IN_REFUND_FORBIDDEN` messages.
  - `features/buy-phone/lib/buy-error.ts`, `ui/BuyPhoneDialog.tsx` — not-sold refusal
    message; normal success text kept.
  - `shared/i18n/{en,uz}/{sales,purchases,pos}.json` — new keys, same English text.
  - READMEs: `features/buy-phone`, `features/checkout`, new `features/warranty-lookup`,
    `entities/backup`, `entities/repair`, `entities/shift`.
  - `docs/decisions/0047-client-bonus-printing-buyback.md` — 40 lines.
- How a buy-back is told from a first purchase in the server's answer (item 3):
  **It is not.** `CustomerPurchaseView` is only `{ id, customer, unit, pricePaid,
  accountCode, saleId, soldBy, occurredAt }`; `CustomerPurchaseResult` is
  `{ purchaseId, deviceId }`. There is no bought-back flag, and `saleId` stays null
  for a plain buy-back, so the normal success toast is kept.
  `customer-purchases` sends **no `code`** for the not-sold refusal: it is a 409
  `ConflictException` with `message: "A unit with this IMEI or serial number already
  exists"`. `buy-error.ts` matches that exact text; any other 409 keeps today's text.
- What was found for item 5: no website check blocks an IMEI because the shop sold
  it before — in `features/buy-phone`, `features/checkout` (trade-in) or
  `features/scan-code`. Nothing was removed; the server decides buy-back.
- `pnpm test`, `pnpm lint`, `pnpm build` output (last lines):
  - `pnpm install`: `Lockfile is up to date` · `Packages: +642` ·
    `Done in 1.7s using pnpm v12.16.1`.
  - `pnpm test`: `ℹ tests 97` · `ℹ pass 97` · `ℹ fail 0` · `ℹ skipped 0` ·
    `ℹ duration_ms 229.937958` (includes the new checkout-error and return-error tests).
  - `pnpm lint`: `$ oxlint`; 0 errors, warnings only (all pre-existing long-function
    / react-compiler warnings, including the existing `ReturnSaleDialog` ones).
  - `pnpm build`: `✓ 4243 modules transformed` · `✓ built in 6.33s`; PWA
    `precache 159 entries (3268.20 KiB)`; `files generated`.
  - `graphify update .`: ran in `client/` (3629 nodes, 11217 edges) and at the repo
    root (14281 nodes, 28402 edges); the root run skipped `graph.html` because the
    graph exceeds the 5000-node visualisation limit.
- Not done / skipped / failed:
  - **Screens were not seen**: no browser is available here, so the return dialog,
    buy-phone dialog and till trade-in messages were only read in code; Claude checks
    them.
  - New Uzbek entries intentionally carry the same English text for the translator.
  - No failures otherwise. No `server/**`, `mobile/**`, PRD, plan, rules or `.claude`
    file was touched.

## Check by Claude
- 2026-11-06: checked and merged. Committed properly; the report was accurate and said plainly
  where the server gave no code. After merging `main`: website 97 tests pass, lint 0 errors,
  build passes. One reader for a server error's code (`httpErrorCode` in `shared/api/http.ts`),
  the copies removed. ADR 0047 written, 40 lines.
- One change by Claude on the branch: the "already ours and not sold" refusal was recognised on
  the website by the server's exact English sentence, because the server sent no code. The
  server now sends `code: PURCHASE_UNIT_EXISTS` (`customer-purchases.write.repository.ts`, both
  places), the website matches the code, and the till maps the same code for a trade-in.
  Server build, 648 tests and lint pass.
- Not seen: any of these messages on a screen (they need a sale whose phone was bought back, a
  refused trade-in, and a refused purchase), and the new code on a live server (my one live try
  was refused earlier, for a missing storage value, before it reached that check). The mapping
  is covered by unit tests only.
- Step 11 on the website is complete with this part (handoffs 003 to 009). Left for it: Uzbek
  for the English texts these parts added, and the phone apps.
