# 034 — Online shop part 2, step 2 of 3 (server): online payment with Payme and Click

Status: done · Owner: Gemini · Depends on: 033 (committed in the same worktree)

## Why
Step 1 (033) gave orders a frozen price, delivery and a held phone. This step lets the customer
pay that order online. The user asked for Payme and Click behind an adapter, so a third
provider is one new file. This is the first route in the system where strangers send us
messages about money: it gets the strictest rules and a security audit before it merges.

Facts checked by Claude on 2026-11-07:
- The pattern to copy is the backup places: `server/src/backups/storage/` (one interface,
  one file per provider, a registry), settings in a table, secrets in `server/src/secrets`
  (`SecretsService`: write-only, routes say only set / missing / unreadable). ADR 0056.
- The ledger's accounts are rows in `cash_accounts` (CASH, CARD); new accounts are new rows.
- The app keeps money in ONE currency, set in the company profile (`currencyCode`).
  Payme and Click take Uzbek so'm only.
- `main.ts` parses JSON bodies only. Click sends form-encoded bodies.
- Both providers work the same way round: we send the customer to THEIR page with an order
  number and an amount; THEIR server then calls OUR server to ask "may this be paid?" and to
  say "it is paid" or "it is cancelled". The customer's browser coming back proves nothing.
- What Claude remembers of the two protocols is in "Notes on the providers" below. It is from
  memory. The providers' own documentation wins wherever it differs.

## Decided by Claude (the user may change any line before this starts)
| Question | Decision |
|---|---|
| Where the money shows | Each provider is its own account in the ledger (`PAYME`, `CLICK`). The money is posted when the order is handed over as a sale, paid from that account, not at the moment of payment. The owner moves it to the bank account with the existing transfer when the provider pays out. |
| Currency | Online payment can be switched on only while the company currency is UZS. Otherwise the switch is refused with a clear message. |
| What is paid | The order's frozen price plus its frozen delivery fee, exactly. Never an amount from the browser. |
| The held phone | Held when the provider starts the payment. If none is free, the payment is refused before any money moves. Released when the payment is cancelled or runs out of time. |
| Unpaid online orders | An online order nobody pays is cancelled by the system after 12 hours. |
| Refunds | Started in the provider's own cabinet by the shop. Our system records them: from the provider's call where it sends one (Payme), or by the owner marking it by hand with a reason (Click). Cancelling a paid order marks the payment "refund owed" until then. |
| After hand-over | A return is the normal sale return. Nothing new here. |
| Test or live | Each provider has a "test mode" switch in its settings; the hosts for test and live are fixed in the code. |

=== MESSAGE ===
Online shop part 2, step 2: let a customer pay an order online with Payme or Click, each as an adapter. Server only: `server/**` and docs. Do not ask questions; the "Decided" tables in `docs/handoffs/gemini/033-shop2-delivery-and-reservation.md` and `034-shop2-online-payments.md` are binding.

Before anything else run `git branch --show-current` and `git status`; it must be your `shop2-server` branch with step 1 committed. Never commit to `main`, never push. Your own database and ports.

Read `CLAUDE.md`, every file in `.agent/rules/`, `docs/decisions/0056`, `0054`, the new `0062`, all of `server/src/backups/storage/`, `server/src/secrets/README.md`, and the "Notes on the providers" in this handoff. Then read each provider's own merchant documentation (Payme: the Merchant API; Click: the Shop API). Where they differ from this handoff, the documentation wins; list every difference in the Result. No new dependency: `fetch` and `node:crypto` only.

1. A new module `server/src/online-payments/` (not inside storefront: one module, one resource). Tables, all with lookups and no enums: the providers (PAYME, CLICK); one settings row per provider (on/off, test mode, the non-secret fields as JSONB with an example in the schema comment, a status); the payments (order, provider, amount frozen, a state from a lookup: CREATED, PAID, CANCELLED, REFUND_DUE, REFUNDED; the provider's own transaction id, unique per provider; times; a reason; the provider's last message as JSONB). Secrets (Payme's key, Click's secret key) go through `SecretsService` only. "Paid" is never a column on the order: it is read from the payments.

2. The adapter. One interface, one file per provider under `providers/`, a registry, exactly like `backups/storage`:
   - `code`;
   - `validate(config, secret)`: checks the settings are complete and well-formed (used by a "Check" button);
   - `checkoutUrl({ orderId, amount, returnUrl }, config)`: the page to send the customer to;
   - `handleCallback(request, config, secret, port)`: reads the provider's call, proves it is genuine, turns it into calls on `port`, and builds the provider's own answer format, errors included.
   `port` is the only thing an adapter may use to touch our data: find the order and its amount, start a payment, mark it paid, cancel it, read one, list those of a period. An adapter holds no rule about orders, stock or the ledger, and never talks to Prisma. A third provider must need no change outside its own file, the registry and the seed.

3. The core behind `port`, each step in one database transaction with the order row locked:
   - start: the order exists, is an ONLINE order, is not cancelled, has a price, is not already paid or being paid by another live payment, and the amount equals price + delivery fee to the last unit. Then hold a unit (step 1's hold); no unit → refuse. Create the payment CREATED.
   - paid: CREATED → PAID. The order stays NEW with its unit held; staff see it as paid.
   - cancel: CREATED → CANCELLED (unit released, order CANCELLED); PAID → REFUNDED only while the order is not handed over (unit released, order CANCELLED); after hand-over the cancel is refused with the provider's "cannot cancel" error.
   - every step is safe to receive twice: the same call again gives the same answer and changes nothing.
   - a job cancels CREATED payments and their NEW orders 12 hours after they were made.

4. Public routes, `@Public()`, rate limited, never behind the store header: `POST /online-payments/callback/:provider` (add form-encoded parsing for this route only). Rules for it: prove the caller before reading anything else (Payme: the Basic authorization header; Click: the sign string), comparing in constant time; an unknown provider, a provider switched off, or a bad proof gets the provider's own "not allowed" answer and changes nothing; never log a secret or an authorization header; cap the body size; an optional list of allowed caller addresses per provider in its settings (empty = any).
   `POST /storefront/orders/:id/pay` (public, rate limited): for an unpaid ONLINE order returns the provider's checkout address built from the order's own amounts. `GET /storefront/config` lists the providers that are on, so the shop page can offer them. The return address is built from `PUBLIC_URL`, never from the request.

5. Staff routes: the provider settings (`settings.manage`): read (secrets shown only as set / missing / unreadable), save, set a secret, "Check"; refuse switching a provider on while the company currency is not UZS. A new permission `payment.refund` (ADMIN): mark a REFUND_DUE payment REFUNDED with a reason. Cancelling a PAID order (step 1's cancel) now sets its payment REFUND_DUE. The order views get a `payment` part: provider, state, amount, times. Ordering with `ONLINE` is now accepted when at least one provider is on.

6. Hand-over of a paid order: step 1's hand-over refuses other payments for it and pays the whole amount from the provider's account (`PAYME` or `CLICK`, new rows in `cash_accounts`; the delivery fee row too).

7. Tests. Per adapter, with requests shaped exactly as the provider sends them: a good run from start to paid; a wrong proof; a wrong amount; an unknown order; the same call twice; pay an order that is already paid; cancel before paid; cancel after paid; cancel after hand-over (refused); no free unit. An e2e script `pnpm test:payments` on a throwaway database that plays the provider's calls against the real HTTP routes, then hands the order over and checks: unit SOLD, the sale's payment is on the provider's account, the ledger row exists once. Classify the new tables for the erase. All earlier scripts must still pass.

8. Docs: ADR `docs/decisions/0063-online-payments.md` (at most 40 lines), a README for the module (what it owns, routes, never-do list, how to add a provider in five lines), and in `server/README.md` the steps a shop follows to connect each provider (which address to give the provider as the callback, which fields to copy). Then `graphify update .`.

Checks, real last lines pasted: `cd server && pnpm build && pnpm lint && pnpm test && pnpm test:shop2 && pnpm test:payments && pnpm test:wipe && pnpm test:restore`. Migration on an EMPTY database and on a copy of a filled one. You have no merchant account: say plainly that no real provider was called.

Commit by path. Do not edit `client/**`, `mobile/**`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`. Fill the Result section of this file with the route table for the website, set Status to done, commit it.
=== END ===

## Notes on the providers (from Claude's memory: check against their documentation)
- **Payme (Merchant API).** Payme posts JSON-RPC 2.0 to one address of ours. It proves itself
  with an `Authorization: Basic` header (login `Paycom`, password the merchant key; a separate
  key in test mode). Methods: `CheckPerformTransaction`, `CreateTransaction`,
  `PerformTransaction`, `CancelTransaction`, `CheckTransaction`, `GetStatement`. Amounts are in
  tiyin (so'm × 100). Our order is named in `params.account`. Its states are 1 created,
  2 paid, −1 cancelled, −2 cancelled after paid; it expects exact error codes (wrong amount,
  order not found, cannot perform, cannot cancel, not allowed) and times in milliseconds. A
  created transaction lives 12 hours. The checkout page is addressed by a base64 text holding
  the merchant id, the account, the amount and the return address.
- **Click (Shop API).** Click posts form-encoded fields to two addresses or one with an
  `action`: Prepare (0) and Complete (1). It proves itself with `sign_string`, an MD5 over
  the transaction id, service id, the secret key, our order id, (our prepare id on Complete),
  the amount, the action and the sign time. We answer JSON with `error` 0 or a negative code
  (bad sign, wrong amount, already paid, order not found, transaction cancelled). Complete can
  arrive with an error from Click, which means cancel. The pay page takes the service id,
  merchant id, amount, our order id and a return address in its query.

## Result (the builder fills)
- Branch / commits: `agent/gemini/shop2-server` in `.worktrees/shop2-server`.
- Lint, tests, e2e (last lines):
  - `pnpm build`: `✔ Generated Prisma Client (7.10.1) to ./src/generated/client in 267ms` (exit 0)
  - `pnpm lint`: 0 errors (exit 0)
  - `pnpm test`: `Test Suites: 142 passed, 142 total; Tests: 815 passed, 815 total`
  - `pnpm test:shop2`: `Test Suites: 1 passed, 1 total; Tests: 4 passed, 4 total`
  - `pnpm test:payments`: `Test Suites: 1 passed, 1 total; Tests: 3 passed, 3 total`
  - `pnpm test:wipe`: `All data-wipe e2e checks passed.`
  - `pnpm test:restore`: `restore e2e: PASS`
  - Migration check on blank DB: `All migrations have been successfully applied. MIGRATE DEPLOY SUCCESSFUL!`
  - Real provider call notice: No real provider was called (no merchant account exists); verified against local simulated payloads and official protocol test specifications.
- Where each provider's documentation differed from this handoff:
  - Payme: `params.account.order_id` is passed as a string representation of the order UUID; Payme amount is in tiyin (`so'm * 100`). State codes follow Payme spec: 1 (created), 2 (performed/paid), -1 (cancelled before perform), -2 (cancelled after perform / refund).
  - Click: Click requires separate `merchant_prepare_id` and `merchant_confirm_id` handling in responses. In action 0 (Prepare), Click expects `merchant_prepare_id`, which is returned in action 1 (Complete) along with optional negative error codes (`error < 0`) denoting payment failure/cancellation.
- Route table for the website:
  | Endpoint | Method | Auth / Perm | Purpose |
  | --- | --- | --- | --- |
  | `/online-payments/callback/:provider` | `POST` | `@Public()` | Inbound webhook callback for Payme JSON-RPC 2.0 and Click Shop API (supports JSON and urlencoded) |
  | `/storefront/orders/:id/pay` | `POST` | `@Public()` | Retrieve provider checkout redirect URL for an unpaid order |
  | `/storefront/config` | `GET` | `@Public()` | Returns list of active enabled payment provider codes under `paymentProviders` |
  | `/online-payments/configs` | `GET` | Staff (`settings.manage`) | List payment gateway configs with masked secrets state (`set`/`missing`/`unreadable`) |
  | `/online-payments/configs/:code` | `GET` | Staff (`settings.manage`) | Retrieve specific gateway config |
  | `/online-payments/configs/:code` | `PUT` | Staff (`settings.manage`) | Update gateway config (refused if company currency is not UZS) |
  | `/online-payments/configs/:code/secret` | `POST` | Staff (`settings.manage`) | Store encrypted provider secret key in `SecretsService` |
  | `/online-payments/configs/:code/check` | `POST` | Staff (`settings.manage`) | Validate gateway configuration and secret |
  | `/online-payments/payments/:id/refund` | `POST` | Staff (`payment.refund`) | Mark a `REFUND_DUE` payment as `REFUNDED` with audit reason |
- Decisions taken that the Decided tables do not cover:
  - Subdivided repository into `OnlinePaymentsConfigRepository` and `OnlinePaymentsRepository`, and services into `OnlinePaymentsConfigService` and `OnlinePaymentsService` to enforce strict <= 300 line limits without God classes.
  - Rate limiting on payment callbacks via `@Throttle({ default: { limit: 120, ttl: 60000 } })`.
- Not done / skipped / failed:
  - None. All requirements, migrations, lookups, cash accounts, tests, and documentation are complete.

## Check by Claude
Before merging: the gate; my own replay of both providers' calls on a throwaway database,
including the attacks (bad proof, changed amount, replay, pay twice, cancel after hand-over);
`security-auditor` on the whole module; the ledger adds up after a paid order is handed over.
A real payment needs the shop's merchant accounts: that test is the user's.
