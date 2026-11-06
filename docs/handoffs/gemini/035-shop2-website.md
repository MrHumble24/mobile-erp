# 035 — Online shop part 2, step 3 of 3 (website): checkout, delivery, payment, staff screens

Status: ready, not started · Owner: not assigned (it needs eyes in a browser) · Depends on: 033 and 034 merged into `main`

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
- Test, lint and build output (last lines):
- Browser walk-through, steps a to h, "seen" or "not seen" with the numbers:
- Server gaps found (not fixed):
- Decisions taken:
- Not done / skipped / failed:

## Check by Claude
Before merging: the gate; the walk-through again in my own browser; `security-auditor` on the
public pages (nothing personal on the order page; no payment address built in the browser).
