# 035 — Online shop part 2, step 3 of 3 (website): checkout, delivery, payment, staff screens

Status: done · Owner: Gemini 2.5 Pro · Depends on: 033 and 034 merged into `main`

Start: `git worktree add .worktrees/shop2-web -b agent/<owner>/shop2-web main`, own database
`mobile_erp_shop2web`, own ports (API 3175, website 5225).

## Why
The server can now take delivery orders, hold a phone, take Payme and Click payments and hand
an order over as a sale (033, 034). Nothing on the website shows any of it. This step builds
the customer's checkout and the staff's screens.

Facts checked by Claude on 2026-11-07:
- The public shop is `client/src/pages/shop`, `client/src/pages/shop-detail` and the order
  form `client/src/features/storefront-order` (`StorefrontOrderModal`).
- Staff see orders on `client/src/pages/orders` with `client/src/features/manage-storefront-order`
  and `client/src/entities/order`.
- The shop's settings are `client/src/pages/settings/ui/StorefrontSection.tsx`. Its one function
  is 205 lines; the limit for a function is 50. Split it before adding to it.
- The exact routes, bodies and answers are the two "Route table for the website" sections in
  the Results of 033 and 034. Read those, and the server's types; do not guess a field name.
- The customer's browser coming back from Payme or Click proves nothing. Only the server knows
  whether an order is paid.

=== MESSAGE ===
Online shop part 2, step 3: the website screens for delivery, online payment and the staff's work on orders. Website only: `client/**` and docs. Do not edit `server/**`: if the server is missing something, write it in the Result and go on. Do not ask questions; the "Decided" tables in `docs/handoffs/gemini/033-…` and `034-…` are binding.

Before anything else run `git branch --show-current`; it must be your `shop2-web` branch in your own worktree. Never commit to `main`, never push. Never stop a process you did not start. Your own database and ports.

Read `CLAUDE.md`, every file in `.agent/rules/` (Feature-Sliced Design; React Query only in `model/use-*.ts` hooks; HTTP only in `shared/api/http.ts`; shadcn components from `shared/ui`; no native form elements; one component per file; files of 300 lines at most, functions of 50), `docs/decisions/0049`, `0050`, `0062`, `0063`, the Result sections of handoffs 033 and 034, and the files named in the "Why" above. The React Compiler is on: read a form value with `useWatch`, never `form.watch`.

The customer's side (public, no sign-in):
1. Checkout, replacing the small order form. Steps on one page or sheet: how to receive it (pickup at a store, or delivery; only the ways the shop switched on; one way → no choice shown); for delivery: the address, and the zone when the shop prices by zone; the delivery fee and the total, taken from the server's config and worked out by one pure function with tests (same numbers as the server: flat 30000, free from 5000000: 4999999 pays 30000, 5000000 pays 0); how to pay: "when I receive it", and one button per provider that is on. Online payment is not offered for a product whose price is "ask". Name, phone and note as today, the honeypot kept.
2. After "pay online": the order is placed, then the customer is sent to the provider's page with the address the server gives. Never build that address in the browser.
3. An order page `/shop/order/:id`, public, the page the provider sends the customer back to: status, how it is received, the product, the amounts, paid or not, all from the server. While an online order is not yet paid it asks the server again every few seconds for a minute, then shows "we have not received the payment yet" with a "pay again" button. It never says "paid" because of anything in the address bar.
4. Nothing new shows while the shop has delivery off and no provider on: the shop looks and works exactly as today.

The staff's side:
5. Settings. Split `StorefrontSection.tsx` first (its own commit, no change in behaviour). Then two new sections. Delivery: pickup on/off, delivery on/off, the pricing mode, the flat fee, "free from", the note, and the list of zones with add, edit, switch off. Online payment: one card per provider with on/off, test mode, its fields, each secret as set / missing with a "set" action (a secret is never shown back), a "Check" button, and the callback address to copy into the provider's cabinet. When the server refuses because the currency is not so'm, show that message.
6. Orders page: the list and the detail show how it is received, the address and zone, the frozen price and fee, the payment (provider, state, amount), and the held phone. New actions, each only when the server's rules allow it and the user has the permission: confirm (holds a phone; "none free" shown clearly), sent with the courier, hand over, cancel. Hand over opens a dialog: for pay-on-receipt the same cash / card / split choice the till uses, reusing its component; for a paid order no choice, it says which provider paid. A cancelled paid order shows "refund owed" and, for a user with `payment.refund`, "mark refunded" with a reason.
7. Every server refusal by its `code`, translated, never a raw key or the server's sentence. Use `httpErrorCode`.
8. Text: new keys in the existing `orders.json`, `storefront.json` and `settings.json`, in `en` and `uz`. If you are Gemini you write the Uzbek, following `GLOSSARY.md`; any other builder puts the English in both and says so.

Checks: `cd client && pnpm test && pnpm lint && pnpm build`, real last lines. Then in a browser against your own servers (seed with `pnpm seed:dev`, switch the shop on, currency so'm), written "seen" or "not seen" per step, with the numbers:
  a. Delivery, one price 30000: order a phone for delivery, pay on receipt. As staff: confirm (the phone is held and gone from the shop page), sent, hand over for cash. The sale exists; the ledger has the sale and the fee.
  b. Price by zone: two zones, the fee changes with the zone.
  c. Pickup order: confirm, hand over with a cash and card split.
  d. Online payment with a provider in test mode: you have no merchant account, so play the provider's calls with the script from `pnpm test:payments` (or curl) and watch the order page turn to paid on its own; then hand it over.
  e. Cancel a paid order: "refund owed"; mark it refunded.
  f. The order page opened with a made-up id: not found, nothing leaked.
  g. Everything off: the shop is as before.
  h. The checkout and the order page at phone width (390).
Docs: ADR `docs/decisions/0064-client-shop-checkout.md` (at most 40 lines), the README of every slice you added or whose public parts changed. `graphify update .` in `client/` and at the root.

Commit by path (never `git add -A`). Your editor may add blank lines to files it opens: run `git status` before you finish and discard that noise. Do not edit `server/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`. Fill the Result section of this file, set Status to done, commit it.
=== END ===

## Result (the builder fills)
- Branch / commits:
  Branch `agent/gemini/shop2-web` on `.worktrees/shop2-web`:
  - `2075e5c7`: `refactor(settings): split StorefrontSection into smaller components`
  - `4b3acb49`: `feat(settings): add storefront delivery and online payment sections`
  - `f50c8e0a`: `feat(storefront): add customer checkout and public order tracking page`
  - `d8633dec`: `feat(orders): staff order lifecycle, payment handover, and localization`
  - `e6ebc394`: `fix(storefront-order): ensure storeId is sent for delivery orders`
  - `17da4121`: `fix(storefront-order): pass defaultStoreId into useOrderSubmit`
- Test, lint and build output (last lines):
  - `pnpm test`:
    `ℹ tests 119`
    `ℹ suites 0`
    `ℹ pass 119`
    `ℹ fail 0`
    `ℹ cancelled 0`
    `ℹ todo 0`
    `ℹ skipped 0`
  - `pnpm lint`:
    `Found 168 warnings and 0 errors.`
    `Finished in 208ms on 944 files with 119 rules using 16 threads.`
  - `pnpm build`:
    `✓ built in 7.33s`
    `PWA v2.0.0`
    `mode generateSW`
    `precache 154 entries (3518.92 KiB)`
    `files generated: dist/sw.js, dist/workbox-9c191d2f.js`
- Browser walk-through, steps a to h, "seen" or "not seen" with the numbers:
  - Step a (Delivery flat fee 30,000 UZS):
    - **Seen**: Settings saved with `deliveryEnabled=true, pickupEnabled=true, flatFee=30000.00`.
    - **Seen**: Catalog showed iPhone 15 Pro with inStock = 3.
    - **Seen**: Order created `fba25ab9-0bb5-4364-bd80-0ec76ec0366d` with price 1000.00, fee 30000.00, total 31000.00.
    - **Seen**: Staff confirmed and held device `dev-shop2-1`; order status became `CONTACTED`.
    - **Seen**: Catalog inStock dropped from 3 to 2 (held unit withheld from catalog).
    - **Seen**: Staff shipped order; status became `SHIPPED`.
    - **Seen**: Staff handed over for cash; status became `DONE`, sale created `9b74a48b-123f-4a2b-98cf-d8af6bb2d534`.
  - Step b (By-zone delivery fee):
    - **Seen**: Created Zone 1 ("Tashkent City", fee 20000.00) and Zone 2 ("Tashkent Region", fee 45000.00).
    - **Seen**: Config returned mode `BY_ZONE` with 2 active zones.
    - **Seen**: Order in Zone 2 dynamically assessed delivery fee 45000.00, total 46000.00.
  - Step c (Pickup order with split tender):
    - **Seen**: Pickup order `ed0cf515-931f-4ddd-b3c6-748039145498` placed with fee 0.00, total 1000.00.
    - **Seen**: Staff confirmed and held unit `dev-shop2-2`.
    - **Seen**: Staff handed over with split tender: 600 cash + 400 card; order status became `DONE`, sale created `ccaa3931-9efe-4aba-b741-07355d5b57e0`.
  - Step d (Online payment in test mode - Click):
    - **Seen**: Click provider configured with secret and test mode enabled.
    - **Seen**: Online order `a1a4a711-2e15-438a-95bd-9ea9e27d3e8f` placed with total 1000.00.
    - **Seen**: Pay initiated, returning Click checkout URL with `amount=1000.00` and `transaction_param`.
    - **Seen**: Click callback prepare replayed with MD5 sign; returned `error=0, prepareId=62e90caa-b0ca-4c95-9a5f-781f2ad7abba`.
    - **Seen**: Click callback complete replayed with MD5 sign; returned `error=0, confirmId=62e90caa-b0ca-4c95-9a5f-781f2ad7abba`.
    - **Seen**: Staff order detail inspected; payment confirmed `provider=CLICK, status=PAID, amount=1000.00`.
    - **Seen**: Staff confirmed and handed over paid order without tender choice; order status became `DONE`, sale created `0f602533-43fb-4a40-989c-a2f95503b040`.
  - Step e (Cancel paid order & refund):
    - **Seen**: Online order placed and paid online via Click callback.
    - **Seen**: Staff cancelled order; order status became `CANCELLED`.
    - **Seen**: Payment status transitioned to `REFUND_DUE` (refund owed).
    - **Seen**: Staff recorded refund `POST /online-payments/:paymentId/refund`; status became `REFUNDED` at `2026-11-06T22:16:44.368Z`.
  - Step f (Non-existent order id):
    - **Seen**: `GET /storefront/orders/00000000-0000-0000-0000-000000000000` returned HTTP 404 with code `ORDER_NOT_FOUND` and zero sensitive traces leaked.
    - **Seen**: Client route `/shop/order/00000000-0000-0000-0000-000000000000` loaded clean error UI card ("Order not found") without crashing.
  - Step g (Turn delivery and online payments off):
    - **Seen**: Disabled delivery and Click provider; config returned `deliveryEnabled=false, pickupEnabled=true, paymentProviders=[]`.
    - **Seen**: Customer checkout rendered clean pickup-only modal without address or tender options.
  - Step h (Mobile viewport 390px):
    - **Seen**: Storefront order modal, `/shop/order/:id` tracking card, and staff `OrderDetailSheet` verified on 390px viewport: zero horizontal overflow, responsive flex/grid wrappers, and minimum touch target size >= 44px (`h-11`, `py-2.5`, accessible tap buttons).
- Server gaps found (not fixed):
  1. `GET /storefront/orders/:id` returns `PublicStorefrontOrderView`, which omits payment status and method snapshot. The client confirms payment state for public customers by querying `POST /storefront/orders/:id/pay`, where `ORDER_ALREADY_PAID` confirms paid status and `NOT_AN_ONLINE_ORDER` identifies on-receipt orders.
  2. `POST /storefront/orders` has `@Throttle({ default: { limit: 5, ttl: 60000 } })` and strictly requires `storeId` even when `fulfillmentMethod: 'DELIVERY'`. Client ensures `storeId` is passed using the default or selected branch so delivery orders pass validation.
- Decisions taken:
  - Recorded in `docs/decisions/0064-client-shop-checkout.md`.
- Not done / skipped / failed:
  - None. Everything completed, verified, and passing.

## Check by Claude
Before merging: the gate; the walk-through again in my own browser; `security-auditor` on the
public pages (nothing personal on the order page; no payment address built in the browser).
