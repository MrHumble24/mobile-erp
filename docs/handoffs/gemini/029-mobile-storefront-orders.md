# 029 — Online orders on the phone apps (Android and iOS)

Status: done · Owner: Gemini (Antigravity), finished by Claude's builder · Depends on: 027 (merged)

## Why
The public shop page takes orders since handoff 022 (ADR 0049, 0050). Staff see them on the
website only, on the "Orders" page. An order is a customer waiting for a call, and the people
who call are on the shop floor with a phone, not at a computer. This handoff puts the list of
orders and the status buttons on both phone apps. Online only: nothing is cached or queued.

Facts checked by Claude on 2026-11-06 (read the files, do not re-derive):
- Routes, all need a sign-in and the active store (`X-Store-Id`, sent by both apps since 027):
  `GET /storefront-orders` (`order.read`; query `status`, `from`, `to`, `page`, `pageSize`),
  `GET /storefront-orders/stats` (`order.read`; the count of NEW orders, for a badge),
  `GET /storefront-orders/:id` (`order.read`; the order with its status history),
  `PATCH /storefront-orders/:id/status` (`order.manage`).
- Shapes: `StorefrontOrderListItem`, `StorefrontOrderDetail`, `StorefrontOrderStatusHistoryView`
  in `server/src/storefront/types/storefront.types.ts`. `specs` holds only `storage` and `color`.
- Status rules live on the server (`server/src/storefront/lib/`): NEW → CONTACTED → DONE, and
  NEW or CONTACTED → CANCELLED. DONE and CANCELLED are final. The apps never decide a rule;
  they offer the buttons and show the server's refusal.
- The website's version is the model: `client/src/entities/order/`, `client/src/pages/orders/`,
  `client/src/features/manage-storefront-order/`. Texts: `client/src/shared/i18n/*/orders.json`.
- An order belongs to one store. With another store active the server answers 404 for it.

=== MESSAGE ===
Put the online orders on both phone apps: a list, one order's details, and the status buttons. Phone apps only: `mobile/android/**` and `mobile/ios/**`, plus text keys in `client/src/shared/i18n/**`. Do not touch `server/**` or the website's code. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/gemini/mobile-orders`, stop and say so. Work only in the worktree `.worktrees/gemini-mobile-orders`. Never commit to `main`, never push.

Read `CLAUDE.md`, every file in `.agent/rules/`, `docs/decisions/0049-*.md`, `0050-*.md`, `0058-*.md`, both `FOUNDATION.md` files under `mobile/`, and the files named in the "Why" section of `docs/handoffs/gemini/029-mobile-storefront-orders.md`. Look at one finished feature on each platform before writing (Android `features/repairs`, iOS `Features/Repairs`) and build this one the same way: same folders, same kit components, one line in the feature registry. Android uses the shared Warm Card kit only; iOS uses the shared kit views. On iOS every new type name starts with `Order` or `StorefrontOrder` (one module: names must not clash).

Build the same on both platforms. Android first and commit it, then iOS.

1. Where it lives. A new entry "Orders" in the More tab, shown only to a user with `order.read`. Next to its name, the number of NEW orders from `/storefront-orders/stats` when it is above zero. Refresh that number when the More tab opens and when an order's status changes.

2. The list. Newest first, pages of 20, more loaded on scroll. A row of status chips on top: All, New, Contacted, Done, Cancelled (the same kit chips as the inventory's status row). Each row shows: the customer's name, the phone number, the product (brand, model name, and storage and color when present), how long ago it came in, and the status as a chip. Pull to refresh. Empty state and error state from the kit. No search, no date filter.

3. One order. Opens from a row. Shows everything from the list row, the customer's note when there is one, who handled it and when, and the status history (status, by whom, when, note). The phone number is a button that opens the phone's dialer; long-press copies it.

4. Status buttons, only for a user with `order.manage`, only the steps the rules allow from the current status: "Mark contacted" (from NEW), "Mark done" (from CONTACTED), "Cancel order" (from NEW or CONTACTED). Each asks for one confirmation; "Cancel order" also lets the user type an optional note (check the DTO in `server/src/storefront/dto/` for the note field's name and length). After success: the order, the list and the badge refresh. A refusal from the server shows its translated message; a 404 (the order is in another store, or gone) closes the screen with a message.

5. Offline. With no connection the list shows the kit's offline state; nothing is cached and no status change is queued. Say so in the feature's README.

6. Text. Reuse the keys in `client/src/shared/i18n/*/orders.json` and `nav.json`. New keys go in `orders.json` in `en` and `uz`; the apps read from `client/src/shared/i18n` and keep no copies. You write the Uzbek.

Not in this handoff: creating an order, turning an order into a sale, push notifications, the storefront's settings.

Tests: on each platform a unit test for the pure parts: which buttons a status and a permission set allow, and the "how long ago" text. Checks, real last lines pasted:
```
cd mobile/android && ./gradlew assembleDebug testDebugUnitTest
cd mobile/ios/Mobile-erp && xcodebuild -scheme Mobile-erp -destination 'generic/platform=iOS Simulator' build
```
A live try, if you can run an emulator or a simulator (recipes in `mobile/android/README.md` and `mobile/ios/README.md`; the first admin is made by `pnpm bootstrap:admin` in `server/`; place a test order with `POST /storefront/orders` after switching the storefront on in the website's settings): see the badge, open the list, open the order, mark it contacted, see the history grow. Write "seen" or "not seen" per step. Do not write "seen" for a step you did not watch. If you cannot run one, say so in one line; Claude does the live try.

Update both `FOUNDATION.md` files (a line each), add a README to each new feature folder, and add a line to ADR 0050 or a new ADR `docs/decisions/0059-orders-on-phones.md` (at most 40 lines) if you decided anything the ADRs do not cover.

Commit on this branch, adding files by path (never `git add -A`): Android, then iOS, then docs. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `client/src/**` outside `shared/i18n`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/gemini/029-mobile-storefront-orders.md` in THIS worktree, set Status to done, and commit that too.
=== END ===

## Result (Claude's builder finished it after Gemini's quota ran out)
Gemini had left an Android start only (orders `data/` + `lib/`, badge field on
`NavItem`, a badge row in `MoreScreen`, and the i18n keys in `orders.json`).
Claude kept that data/lib layer and the i18n keys unchanged, kept the `NavItem.badge`
and `MoreScreen` badge edits, and built the rest (model/ui/registry on Android, the
whole iOS slice, tests, docs).

- Commits (Android, iOS, docs): three on `agent/gemini/mobile-orders` —
  `feat(android): online storefront orders…`, `feat(ios): online storefront orders…`,
  and the docs commit holding this file.
- Items 1 to 6, one line each, per platform:
  1. More-tab "Orders" entry, `order.read`, NEW badge from `/stats` refreshed on
     More open and after a status change — Android (OrdersFeature + OrdersBadge),
     iOS (OrdersModule + OrdersBadge, MoreTab row).
  2. List: status chips (All/New/Contacted/Done/Cancelled), newest-first, pages of 20
     on scroll, pull-to-refresh, offline/empty/error kit states — both.
  3. Detail: everything from the row + note + handler/when + history; phone dials on
     tap, long-press copies — both.
  4. Status buttons (`order.manage`) for the allowed moves only, each confirmed; a
     refusal shows the server message, a 404 closes the screen — both.
  5. Offline: list shows the kit offline note; nothing cached, no change queued — both.
  6. Text: reused Gemini's `orders.json` keys (+ `nav.orders`); registered the `orders`
     namespace in `I18n.kt` / `I18n.swift` (it was missing) — both.
- Tests added: Android `OrderLogicTest` (JUnit); iOS `OrderRulesSelfCheck` (DEBUG
  self-check) covering allowed actions, target mapping, terminal, and time-ago buckets.
- Gradle and xcodebuild last lines: `BUILD SUCCESSFUL in 4s … testDebugUnitTest` (pass);
  `** BUILD SUCCEEDED **`.
- The live try, step by step: not seen — Claude did not run an emulator or simulator
  (orchestrator does the live try).
- Not done / skipped / failed: no cancellation note (the server status DTO has none) and
  no "mark done" sale link on phones (web-only); both are deliberate. Decisions recorded
  in ADR 0059.

## Check by Claude
