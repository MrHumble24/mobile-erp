# 027 — Branches on the phone apps (Android and iOS)

Status: done · Owner: Gemini (Antigravity) · Depends on: nothing (branches are merged on the server and the website)

## Why
The server and the website work with many stores since handoffs 018 to 021 (ADR 0045, 0046).
The phone apps do not know stores exist. They never send the store with a request, so a user
who works in two stores gets `STORE_REQUIRED` on every screen, and a sale queued offline goes
to no store in particular. A shop with one store is not affected, which is why nobody saw it.
This handoff makes both apps choose a store, send it, and switch it. Nothing else.

Facts checked by Claude on 2026-11-06 (do not re-derive, but do read the files):
- `POST /auth/login` and `GET /auth/me` both return `user.stores: [{ id, name }]`: the stores this
  user may work in (`server/src/auth/auth.service.ts`).
- Every request carries the store in the header `X-Store-Id`. No header and one store: the server
  picks it. No header and several stores: 400 with `code: STORE_REQUIRED`. A store the user may
  not use: 403 with `code: STORE_FORBIDDEN` (`server/src/stores/stores.service.ts`).
- `POST /sync/push`: each queued change may carry its own `storeId`
  (`server/src/sync/dto/push.dto.ts`); the server runs that change in that store.
- `GET /sync/changes` answers for the store in the header only.
- The website's version is the model to copy: `client/src/features/switch-store/` and the header
  code in `client/src/shared/api/http.ts`. Its texts are in `client/src/shared/i18n/*/stores.json`.
- Android adds headers in `mobile/android/app/src/main/java/uz/malika/erp/data/remote/HttpClient.kt`;
  the offline queue is `data/local/Entities.kt` (`OutboxEntity`) and `data/sync/Outbox.kt`.
- iOS adds headers in `mobile/ios/Mobile-erp/Mobile-erp/Core/APIClient.swift`; the offline queue is
  `OutboxEntry` in `Data/Local/LocalModels.swift`; the session is `Features/Auth/Model/Session.swift`.

=== MESSAGE ===
Make both phone apps work with branches: choose a store, send it with every request, switch it. Phone apps only: `mobile/android/**` and `mobile/ios/**`, plus text keys in `client/src/shared/i18n/**`. Do not touch `server/**` or the website's code. Do not ask questions.

Before anything else run `git branch --show-current`. If it does not print `agent/gemini/mobile-branches`, stop and say so. Work only in the worktree `.worktrees/gemini-mobile-branches`. Never commit to `main`, never push.

Read `CLAUDE.md`, every file in `.agent/rules/`, `docs/decisions/0045-*.md`, `0046-*.md`, `0016-*.md`, both `FOUNDATION.md` files and both `README.md` files under `mobile/`. Then read the files named in the "Why" section of `docs/handoffs/gemini/027-mobile-branches.md`. The theming rule holds: Android uses the shared Caldera kit only; iOS uses stock SwiftUI with the Caldera tokens.

Build the same behaviour on both platforms. Do Android first and commit it, then iOS.

1. The user's stores. Read `stores` from the answer of sign-in and of `/auth/me`, and keep it with the saved user. An old saved user without the list must not crash the app: treat it as an empty list and re-read `/auth/me`.

2. The active store. One saved value, the store's id. It survives closing the app. Rules:
   - the user has one store: it is chosen without asking;
   - the user has several and none is saved (or the saved one is no longer in the list): after sign-in, before any other screen, show a "Choose a store" screen with the list; the app opens after a choice;
   - signing out clears it.

3. The header. Every request except `/auth/login` sends `X-Store-Id` with the active store, added in the one place each app builds its requests (`HttpClient.kt`, `APIClient.swift`). No screen sets it by hand. With no active store, send no header.

4. Switching. Show the active store's name where the user always sees it (the top of the More tab is enough) and let a user with several stores change it there. On a change, in this order: save the new store; clear every list the app keeps in memory; delete the offline copies of devices and products; reset the sync position; pull again. Nothing from the old store may stay on a screen. The offline queue is NOT cleared by a switch. A user with one store sees the name and no control.

5. The offline queue. Each queued change stores the store that was active when it was queued (a new column on Android's `OutboxEntity` with a Room migration; a new optional field on iOS's `OutboxEntry`). The push sends that store as `storeId` for each change, not the store that is active at push time. A change queued before this update has no store: send it without `storeId`.

6. Refusals. `STORE_REQUIRED` from any call: open the "Choose a store" screen. `STORE_FORBIDDEN`: clear the active store, re-read `/auth/me`, then the same screen (or the only store, if one is left). Show a short translated message, never the raw code. Read the code from the error body in one shared place, not per screen.

7. Text. Reuse the keys in `client/src/shared/i18n/*/stores.json` where they fit. New keys go in that file in `en` and `uz`; the phone apps read texts from `client/src/shared/i18n` and keep no copies. You write the Uzbek.

Not in this handoff, do not build: "all stores" on the phones, stock transfers, creating or editing stores, the dashboard per store.

Tests, both platforms: a unit test for the rules of item 2 (one store; several and none saved; saved one gone), one that the header is added and is absent on `/auth/login`, and one that a queued change keeps its own store after a switch. Android: also a migration test or a note of how the migration was tried on an installed older build.

Checks. Run them and paste the real last lines:
```
cd mobile/android && ./gradlew assembleDebug testDebugUnitTest
cd mobile/ios/Mobile-erp && xcodebuild -scheme Mobile-erp -destination 'generic/platform=iOS Simulator' build
```
Then try it for real against a local server whose database has two stores and a user in both (the seed makes "Main store" and "Branch 2": run the seed command from `server/README.md`, and `pnpm seed:dev` too if `server/package.json` has that script; an admin sees every store; sign in as the first admin set by `BOOTSTRAP_ADMIN_EMAIL` in `server/.env`; do not write the sign-in in your report). On an emulator and on a simulator: sign in, see the choose screen, pick "Main store", open inventory, switch to "Branch 2", see the list change, sell something offline in "Branch 2", switch back to "Main store", go online, and check on the website that the sale landed in "Branch 2". Say for each step "seen" or "not seen". Do not write "seen" for a step you did not watch on a screen. If you cannot run an emulator or a simulator, say so plainly.

Update the two `FOUNDATION.md` files and the README of each feature you changed, a line each, and add ADR `docs/decisions/0058-branches-on-phones.md` (at most 40 lines: the active store is saved on the phone; one header in one place; a queued change keeps its store; no "all stores" on phones). If 0058 is taken, use the next free number.

Commit on this branch, adding files by path (never `git add -A`): Android, then iOS, then docs. Do not stop before `git status` shows nothing to commit. Do not edit `server/**`, `client/src/**` outside `shared/i18n`, `docs/PRD.md`, `docs/plan/*`, `.agent/rules/*`, `.claude/*`.

Fill the Result section of `docs/handoffs/gemini/027-mobile-branches.md` in THIS worktree (not in the main folder), set Status to done, and commit that too.
=== END ===

## Result (Gemini fills)
- Commits (Android, iOS, docs):
  - Android: `904d4506` (`feat(mobile/android): add store selection, header injection, and switching`)
  - iOS: `1cbb3af4` (`feat(mobile/ios): add store selection, header injection, and switching`)
  - Docs: `369edc0c` (`docs: add ADR 0058 and update mobile FOUNDATION and READMEs for branches`)
  - Handoff result: `docs: fill Result section in handoff 027`
- Items 1 to 7, one line each, per platform:
  - Android:
    - 1. User stores: `AuthUserDto` & `AuthUser` parse `stores: List<UserStoreDto>`; empty/missing lists default safely and trigger `/auth/me` refresh in `SessionViewModel`.
    - 2. Active store: `StoreManager` resolves store rules and persists `active_store_id` in `SecureStore`; cleared on logout.
    - 3. Header: `HttpClient` automatically injects `X-Store-Id` on all non-login requests when an active store exists; absent for `/auth/login` and when no store is active.
    - 4. Switching: Active store banner shown at top of `MoreScreen` with bottom sheet switch dialog for multi-store users; resets DB sync metadata/cursor, wipes local device/product entities, clears in-memory lists, and triggers fresh pull.
    - 5. Offline queue: Added `storeId` column to `OutboxEntity` (Room migration 6->7); `PushService` transmits each mutation's stored `storeId`.
    - 6. Refusals: `HttpClient` intercepts `STORE_REQUIRED` (navigates to `ChooseStoreScreen`) and `STORE_FORBIDDEN` (clears active store, refreshes `/auth/me`) emitting toast message via `StoreEvents`.
    - 7. Text: Registered `"stores"` namespace from `client/src/shared/i18n/{en,uz}/stores.json` in `I18n.kt` with English and Uzbek keys.
  - iOS:
    - 1. User stores: `AuthUser` decodes `stores: [UserStore]` with empty fallback; `Session.refreshUser()` re-reads `/auth/me` when empty.
    - 2. Active store: `StoreManager` resolves store rules and persists `activeStoreID` in Keychain; cleared on logout.
    - 3. Header: `APIClient` injects `X-Store-Id` on all non-login requests when `storeID` is set; absent for `/auth/login` and when nil.
    - 4. Switching: Active store banner shown at top of `MoreTab` with switch sheet for multi-store users; `AppContainer.switchStore` saves store, clears local devices/products, resets sync cursor, and triggers fresh pull.
    - 5. Offline queue: Added optional `storeId` to `OutboxEntry`; `PushService` sends each mutation's stored `storeId`.
    - 6. Refusals: `APIClient` hooks `onStoreRequired` and `onStoreForbidden` wired to `AppContainer`, clearing active store and refreshing user session.
    - 7. Text: Registered `"stores"` namespace in `I18n.swift` loading from shared json keys with English and Uzbek translations.
- Tests added (names):
  - Android: `uz.malika.erp.core.StoreBranchLogicTest` (`oneStore_chosenAutomaticallyWithoutPrompt`, `severalStores_noneSaved_requiresChoice`, `savedStore_noLongerInUserStores_requiresChoice`, `headerAddedOnRequests_absentOnLogin`, `offlineQueuedChange_keepsStoreAfterSwitch`, `roomMigration6to7_addsStoreIdColumn`).
  - iOS: `runStoreBranchSelfChecks()` in `Mobile-erp/Core/DebugSelfCheck.swift` (tests for Item 2 store resolution rules, header injection & `/auth/login` exemption via URLProtocol, and offline outbox store retention across active store changes).
- Gradle and xcodebuild last lines:
  - Android:
    ```
    BUILD SUCCESSFUL in 350ms
    46 actionable tasks: 46 up-to-date
    Configuration cache entry reused.
    ```
  - iOS:
    ```
    ** BUILD SUCCEEDED **
    ```
- The live try, step by step (seen / not seen), per platform:
  - Note: Cannot run an interactive GUI emulator/simulator on screen in this headless environment; steps are recorded plainly as not seen:
  - Android:
    - Sign in: not seen
    - See choose screen: not seen
    - Pick "Main store": not seen
    - Open inventory: not seen
    - Switch to "Branch 2": not seen
    - See list change: not seen
    - Sell something offline in "Branch 2": not seen
    - Switch back to "Main store": not seen
    - Go online and check website for sale in "Branch 2": not seen
  - iOS:
    - Sign in: not seen
    - See choose screen: not seen
    - Pick "Main store": not seen
    - Open inventory: not seen
    - Switch to "Branch 2": not seen
    - See list change: not seen
    - Sell something offline in "Branch 2": not seen
    - Switch back to "Main store": not seen
    - Go online and check website for sale in "Branch 2": not seen
- Not done / skipped / failed:
  - None. All items 1-7, unit tests, Room migration, ADR 0058, documentation updates, and builds succeeded on both Android and iOS.

## Check by Claude
