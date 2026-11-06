# 033 — Online shop part 2, step 1 of 3 (server): delivery, a held phone, hand-over

Status: ready, not started · Owner: not assigned (a strong model; not a free one) · Depends on: nothing

Start: `git worktree add .worktrees/shop2-server -b agent/<owner>/shop2-server main`, own database
`mobile_erp_shop2`, own ports (API 3170, website 5220). Steps 1 and 2 share this worktree.

## Why
The online shop takes pickup orders with no payment and holds no stock (ADR 0049). Part 2 adds
delivery and online payment. It is three handoffs: this one (delivery, holding a phone for an
order, handing it over as a sale), 034 (Payme and Click), 035 (the website screens). This one
is useful on its own: delivery with payment to the courier or at the shop.

Facts checked by Claude on 2026-11-07 (read the files, do not re-derive):
- An order is ONE product: `storeId`, `modelId`, `specs` (storage, color), name, phone, note.
  No price, no quantity, no unit. Statuses: NEW → CONTACTED → DONE, or → CANCELLED
  (`server/prisma/schema/storefront.prisma`, rules in `server/src/storefront/lib/`).
- Staff finish an order today by linking a sale they already made at the till (`saleId`).
- Device statuses are a lookup: IN_STOCK, DEFECTIVE, CONSIGNED, IN_TRANSIT, SOLD. There is no
  "held" status. `'IN_STOCK'` is written in 43 places in `server/src`.
- A sale is made in code with `SalesCreateService.create(caller, dto, options)`; it needs an open
  shift when shifts are on, and posts the money to the ledger by account code (`cash_accounts`).
- Money is one currency, set in the company profile (`currencyCode`).

## Decided (the user answered the first three on 2026-11-07; the rest are Claude's defaults and the user may change them)
| Question | Decision |
|---|---|
| Payment providers | Payme and Click, each an adapter, easy to add a third (handoff 034). |
| Delivery | Configurable in settings: off, free, one price, or price by zone; "free above an amount"; pickup can be switched off too. |
| Order without paying online | Allowed: pay the courier or at the shop. |
| One order | Still one product, one piece. A cart with several products is not in part 2. |
| Price on the order | Frozen when the order is placed (the RETAIL price shown), with the delivery fee. A product whose price is "ask" can be ordered but not paid online. |
| Holding stock | A phone is held for an order as a real unit, with a new status RESERVED. The till cannot sell a held phone except through its order. Goods sold by quantity are not held; the shop page only counts open orders against what it shows. |
| When it is held | Paid online: the moment the provider starts the payment (034). Pay on receipt: when staff confirm the order. Released when the order is cancelled. |
| Finishing an order | "Hand over" makes the sale from the order, in the order's price. Linking a till sale by hand stays possible for old orders. |
| Delivery fee money | Posted to the ledger at hand-over as its own row, not part of the phone's sale price or profit. The profit report is not changed here. |
| Outside courier services | Not built. |
| Phone apps | Not in part 2. They keep showing orders as today. |

=== MESSAGE ===
Online shop part 2, step 1: delivery, holding a phone for an order, and handing the order over as a sale. Server only: `server/**` and docs. No website, no phone apps, no online payment (that is handoff 034). Do not ask questions; the "Decided" table in `docs/handoffs/gemini/033-shop2-delivery-and-reservation.md` is binding, and where something is open take the simplest correct option and write it in the ADR.

Before anything else run `git branch --show-current`; it must be your `shop2-server` branch in your own worktree. Never commit to `main`, never push. Never stop a process you did not start. Your own database and ports; never `mobile_erp_main`, never ports 3000 or 5173.

Read `CLAUDE.md`, every file in `.agent/rules/` (no enums: lookup tables; money `Decimal(14,2)`; one concern per table; controller, service, repository; files of 300 lines at most), `docs/decisions/0049`, `0045`, `0058`, the READMEs of `server/src/storefront`, `sales`, `ledger`, `stock`, `stores`, and all of `server/src/storefront/`.

1. Delivery settings (`storefront_settings`, same `PUT /storefront/settings`): `pickupEnabled` (default true), `deliveryEnabled` (default false), a pricing mode from a new lookup table (FREE, FLAT, BY_ZONE), `deliveryFlatFee`, `deliveryFreeFrom` (free at or above this order price; null = never), `deliveryNote` (shown to the customer, 300 characters). A new user-managed table `delivery_zones` (name, fee, sort order, active) with staff routes under `settings.manage`. Refuse a settings save that leaves the shop with neither pickup nor delivery.

2. One pure function for the fee, with unit tests: off → not allowed; FREE → 0; FLAT → the flat fee; BY_ZONE → the zone's fee (an unknown or inactive zone is refused); at or above `deliveryFreeFrom` → 0. Numbers to test: flat 30000, free from 5000000: an order of 4999999 pays 30000, of 5000000 pays 0.

3. The order grows (new columns, new lookups, a migration; never edit an applied one): how it is received (lookup: PICKUP, DELIVERY); the address (500 characters) and the zone for a delivery; how it will be paid (lookup: ON_RECEIPT, ONLINE; ONLINE is refused until 034 switches it on); `priceSnapshot` and `deliveryFeeSnapshot`, frozen when the order is placed; the held unit (`deviceId`, null until held). Nothing derived is stored: no "is paid", no "total".
   `POST /storefront/orders` takes the new fields, checks them against the settings, freezes the price it would show for that product today (null when the price is "ask") and the fee, and answers with the order's id. Keep the rate limit and the honeypot. `GET /storefront/config` also returns what the checkout needs: pickup on/off, delivery on/off, the mode, the fees, the active zones, the note.
   New public `GET /storefront/orders/:id`: only the status, how it is received, the product's name, the two amounts. No name, no phone, no address. Rate limited like the catalog. An unknown id is 404.

4. Statuses: add SHIPPED ("sent with the courier"), allowed only for a delivery order, between CONTACTED and DONE. CONTACTED now means "confirmed with the customer". Update the rule functions in `server/src/storefront/lib/` and their tests; the apps keep offering only what the rules allow.

5. Holding a phone. Add the device status RESERVED to the lookup and the seed.
   - A new staff action "hold": for an order of a unit product, pick a unit of that model and specs in the order's store that is IN_STOCK (the caller may name the unit; otherwise the oldest), set it RESERVED with a status-history row, store it on the order. One order holds at most one unit; one unit is held by at most one open order (make the database enforce it). Two holds at once for the last unit: one wins, the other gets 409.
   - Confirming a pay-on-receipt order (NEW → CONTACTED) holds a unit in the same transaction; if none is free the confirm is refused with a clear code.
   - Cancelling an order releases its unit (RESERVED → IN_STOCK, history row) in the same transaction.
   - `'IN_STOCK'` is written in 43 places. Go through every one and decide. Selling, consigning, transferring, the public catalog and the till's lookups must NOT offer a RESERVED unit. Stock counts, stock value and the balance of goods MUST still count it: it is still the shop's. Put the full list in the Result: file, line, "sellable" or "owned", changed or not. Put the two meanings behind two named helpers so the next reader cannot mix them up.
   - Goods sold by quantity are not held. The public catalog subtracts the open orders (NEW, CONTACTED, SHIPPED) of a quantity product from what it shows as available.

6. Hand-over. A new staff action on a CONTACTED or SHIPPED order (`order.manage`): it makes the sale through `SalesCreateService.create` for the held unit (or one piece of a quantity product) at `priceSnapshot`, to the customer with that phone (find by phone, create if new), with the payments the caller sends (account codes and amounts, like the till; they must add up to the price), links the sale to the order and sets it DONE, all or nothing. The sales code must accept a RESERVED unit only when the sale comes from the order that holds it; every other path still refuses it. The shift rule applies as at the till. The delivery fee, when above zero, is posted to the ledger in the same transaction as its own row with a new transaction type (lookup row), to the account the caller names. An order with no `priceSnapshot` cannot be handed over this way: the answer says to sell at the till and link the sale, as today.

7. Other stores. Every staff route stays scoped to the active store exactly as the existing ones are. A unit of another store can never be held or handed over.

8. Tests: unit tests for every rule above; an e2e script `pnpm test:shop2` on a throwaway database that walks: pickup order → confirm (unit RESERVED, gone from the public catalog and refused at the till) → hand over (sale exists, unit SOLD, ledger row) ; delivery order with a flat fee → confirm → SHIPPED → hand over (fee row in the ledger) ; cancel a confirmed order (unit back IN_STOCK) ; two confirms racing for the last unit. `pnpm test`, `pnpm test:wipe` and `pnpm test:restore` must still pass: classify every new table for the erase (`server/src/data-wipe/lib/wipe-tables.ts`).

9. Docs: ADR `docs/decisions/0062-shop-delivery-and-held-stock.md` (at most 40 lines), the storefront README (public API, never-do list), a line in the READMEs of `sales`, `stock` and `ledger` where their behaviour changed. Then `graphify update .` in `server/` and at the root.

Checks, real last lines pasted: `cd server && pnpm lint && pnpm test && pnpm test:shop2 && pnpm test:wipe && pnpm test:restore`. Test the migration with `migrate deploy` and the seed on an EMPTY database and on a copy of a filled one.

Commit by path (never `git add -A`, never `.env`). Do not edit `client/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`. Fill the Result section of this file, including the route table the website will need (method, path, permission, body, answer), set Status to done, commit it.
=== END ===

## Result (the builder fills)
- Branch / commits:
- Lint, tests, e2e (last lines):
- The `IN_STOCK` list (file, line, sellable or owned, changed or not):
- Route table for the website:
- Decisions taken that the Decided table does not cover:
- Not done / skipped / failed:

## Check by Claude
Before merging: the gate; my own walk on a throwaway database; the till refusing a held phone;
stock value unchanged by a hold; `security-auditor` on the public routes.
