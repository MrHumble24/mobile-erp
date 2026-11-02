# Flutter build waves — `mobile/` (mobile_erp)

Port of the web ERP/POS to a single Flutter codebase. Derived from `docs/PRD.md`,
the server HTTP contract (`server/src/*`), and the React client (`client/src/*`).

**Targets:** Android + iOS phones/tablets **and** desktop (macOS/Windows) — one
adaptive codebase. **Offline-first from day one. State: Riverpod.**
Order mirrors `build-waves.md`: identity → inventory → money → finance → sync/admin.

---

## 1. Architecture

Layered, one feature = one slice (mirrors FSD + `principles.md`; 300-line hard limit applies).

```
lib/
  app/            entry, ProviderScope, go_router + guards, MaterialApp(theme)
  core/           dio client + interceptors, config (--dart-define), error envelope, result
  l10n/           i18n loader + bundled uz/en JSON (reused from client)
  data/
    local/        Drift DB, DAOs, outbox (mutation queue), sync cursor
    sync/         pull (/sync/changes) + push drain (/sync/push) + conflict store
  features/<slice>/
    data/         repository (remote + local), DTO↔model mapping, models
    application/  Riverpod notifiers (AsyncNotifier = query, Notifier = store)
    presentation/ screens + slice widgets
  shared/
    theme/        tokens.dart + app_theme.dart            ← DONE
    ui/           Button/Card/StatusChip/DataTable/ScannerField/Dialog/FormField
    widgets/      adaptive AppShell (NavigationRail⇄NavigationBar), DeviceSheet
```

### Stack (web → Flutter equivalents)

| Concern            | Web (React)                     | Flutter                                             |
|--------------------|---------------------------------|-----------------------------------------------------|
| HTTP               | `fetch` + `shared/api/http.ts`  | **dio** + interceptors (auth header, 401, envelope) |
| Server state/cache | React Query                     | **Riverpod** `AsyncNotifier` + Drift reactive streams |
| Client state       | Zustand                         | **Riverpod** `Notifier`                             |
| Routing + guards   | React Router + `RequirePermission` | **go_router** `redirect` (auth + permission)     |
| Local DB / offline | *(none implemented)*            | **Drift** (SQLite) + `outbox` table                 |
| Connectivity       | —                               | **connectivity_plus**                               |
| Forms              | react-hook-form + zod           | Flutter `Form` + validators                         |
| i18n               | custom JSON loader, uz/en       | **reuse the same JSON** as assets + ~40-line loader |
| Token storage      | localStorage                    | **flutter_secure_storage** (12h JWT)                |
| Money              | Decimal strings                 | **decimal** package, parse defensively              |
| Barcode scan       | HID `BarcodeInput` TextField    | hidden focused field (HID) + **mobile_scanner** (camera) |
| Receipt print      | `window.print` + 58mm CSS       | **esc_pos_utils** (ESC-POS BT/net) / **printing** (desktop) |
| Design system      | shadcn + Caldera tokens         | Material 3 + ported Caldera tokens  ← DONE          |

Config: base URL via `--dart-define=API_URL=…` (default `http://localhost:3000`, no
global prefix). Native apps ignore CORS; a Flutter **web** build needs `CORS_ORIGINS` set.

---

## 2. Offline-first model (the load-bearing part)

The server `/sync/push` registry accepts exactly **four** mutation types
(`sync/handlers/handler-registry.ts`): `sale.create`, `consignment.create`,
`consignment.settle`, `consignment.return`. `/sync/changes` feeds back only
**devices + partners** (each device carrying its latest sale + latest QC). So:

- **Offline reads — devices & partners everywhere.** Drift is hydrated from
  `/sync/changes?since=<cursor>` (page until `nextSince` is null; store cursor).
  Covers inventory lookup, POS device scan, warranty lookup, partner balances.
- **Offline writes — only the 4 money-path mutations.** POS checkout and the
  consignment lifecycle queue to `outbox` with a client UUID `id` + `baseVersion`,
  optimistically update local state, and drain via `/sync/push` when online.
  Exactly the outage-critical paths the PRD demands (§5).
- **Online-only writes** (no server offline handler): device/shipment/QC intake,
  customers, expenses, settings, users/roles. When offline, block with a clear
  "needs connection" message — do **not** fake-queue them.
- **Other list screens** (sales history, reports, full customer list) are online;
  cache last-viewed opportunistically. They aren't in the changes feed.

Push result handling (`applied|duplicate|conflict|rejected`): applied/duplicate →
clear outbox + upsert; **conflict** → mark local + show in a conflict inbox resolved
by a `sync.resolve` user via `/sync/conflicts`; **rejected** → keep + flag (never
silently drop). `ponytail:` offline login is minimal — allow app use while the 12h
token is valid; re-login needs connectivity (ADR 0005 defers a cached verifier).

---

## 3. Cross-cutting (wave 0 builds, every wave applies)

- **Auth/permissions:** `/auth/me` returns `permissions[]`. Store them; gate routes
  (go_router redirect, 403 panel) and widgets with a `can(code)` helper — a direct
  port of `hasPermission`. Guards check **permission codes, never role names**.
- **Cost redaction:** `acquisitionCost`, `landedCost`, `landedCostSnapshot`,
  `overheadCost`, `repairCostEstimate`, `netProfit` are **absent** (not null) for
  under-privileged users. All models mark them optional.
- **Error envelope:** `{ statusCode, message: string|string[], error }`. One mapper
  in `core/`. `forbidNonWhitelisted` → unknown body fields 400, so send clean DTOs.
- **i18n:** copy `client/src/shared/i18n/{uz,en}/*.json` (15 namespaces) into assets,
  default `uz`, `{param}` interpolation, `namespace.key` lookup. Extract the handful
  of hardcoded inline Uzbek strings the web app still has (403 text, toasts).

---

## 4. Build waves

One concern per wave; later waves depend on earlier. `~` = partially done.

| Wave | Name                | Scope                                                                                          | Depends |
|------|---------------------|------------------------------------------------------------------------------------------------|---------|
| 0    | Foundation          | dio+interceptors, config, secure token, error model, Drift skeleton+outbox, connectivity, go_router shell + adaptive AppShell, i18n loader+assets, shared UI kit, theme ✓ | — |
| 1    | Auth & Access       | login screen, session notifier, `/auth/me`, permission gating (router+widgets), logout         | 0 |
| 2    | Inventory           | devices list/filter/search, device sheet, edit-device, device-models, stock-alert-rules, low-stock; **first `/sync/changes` pull → Drift** | 1 |
| 3    | Procurement & QC    | suppliers, shipments list/detail, intake-shipment (batch register), edit-shipment, QC queue/inspections/stats/lookups, grade-device *(online writes)* | 2 |
| 4    | Sales & POS         | POS terminal (scan→cart→checkout, `clientMutationId`+`expectedVersion`+**outbox**), sales list, receipt+thermal print, warranty lookup, returns, customers; **first offline-write path** | 2 |
| 5    | Consignment         | partners, ledger+payments, consignments out/overdue/all, consign-device, settle/return; **outbox handlers** for the 3 consignment types | 2,4 |
| 6    | Finance             | expenses + categories, log-expense, reports (profit/expenses/model-pricing/daily-closing), dashboard KPIs *(online reads)* | 4,5 |
| 7    | Sync & Admin        | full push-drain + background sync, conflict inbox UI (`/sync/conflicts`), users/roles/permission-matrix, settings; offline-login verifier | 4,5 |
| 8    | Polish              | ESC-POS receipt/label printing, HID + camera scanner hardening, desktop keyboard shortcuts, responsive/adaptive audit, empty/error/loading states | all |

Telegram, encrypted backups, landed-cost: **server-side only — no Flutter work.**

---

## 5. Status & next step

- **Done:** Caldera design system ported — `mobile_erp/lib/theme/tokens.dart` +
  `app_theme.dart` (palette, type scale, radii, shadows, status colors, light theme).
- **Next (wave 0):** scaffold `core/` (dio + config + error), `data/local` (Drift +
  outbox), `app/` (go_router + ProviderScope + adaptive shell), `l10n/` (reuse JSON).
- **Governance:** `mobile/` was "not started"; as waves land, add module READMEs and
  (recommended) an ADR for these Flutter architecture decisions. Run graphify once
  the package has real Dart modules.

## 6. Open risks

- `/sync/changes` cursor can skip devices sharing the last millisecond (documented
  server limitation) — acceptable at store scale; note it, don't fight it.
- Offline writes are limited to the 4 registered server handlers. Extending offline
  to intake/QC would need **server** registry changes — out of this plan's scope.
- Thermal printing differs per platform (BT ESC-POS on mobile vs system print on
  desktop) — isolate behind one `ReceiptPrinter` interface in wave 8.
