# Build waves (derived from prisma/schema/*.prisma, PRD modules)

Order follows data dependencies: identity/access → inventory → money flows → UI.
One agent per package per wave; wave N+1 starts after wave N is merged to `main`.
Shared files in a wave: only `server/src/app.module.ts` (one import line per agent).

**Progress (2026-11-02):** waves 1, 2a–2d, 3 and 3b are merged to `main` (server: auth/RBAC, inventory, QC,
sales, consignment, expenses/settings/reports, offline sync, Telegram alerts, encrypted backups). Frontend is
being built by Gemini on `gemini/ui-waves-1-2` (handoff 003). Open: Uzbek Telegram copy (handoff 004 to
write), routing sales/consignment device writes through `DevicesService.changeStatus`, client offline cache
against `/sync/changes` and `/sync/push`.

| Wave | Agent    | Branch                          | Scope (server modules)                                              | Depends on |
|------|----------|---------------------------------|----------------------------------------------------------------------|------------|
| 1    | backend  | agent/backend/foundation        | common (pipes, filters, guards, decorators), auth, users+profile, access (roles, permissions, user overrides, effective set), bootstrap first admin | schema |
| 1    | prd-guardian | —                           | verify this plan against PRD                                         | — |
| 2a   | backend  | agent/backend/inventory         | suppliers, shipments, device-models, devices (specs JSONB, landed cost), status history, qc (inspections, defects, grades), stock-alert-rules | 1 |
| 2b   | backend  | agent/backend/sales             | customers, sales (retail checkout, landed-cost snapshot, idempotency), warranties, returns, receipt payload for thermal printing | 1 |
| 2c   | backend  | agent/backend/consignment       | partners, consignments, partner payments, balances, settle/return → sale | 1 |
| 2d   | backend  | agent/backend/expenses-settings | expense categories, expenses, store settings, reports (profit, expenses, rolling-average acquisition/selling price per model+storage) | 1 |
| 3    | backend  | agent/backend/sync-telegram     | offline sync endpoint (mutation queue, version check, conflicts); Telegram triggers: new shipment, low stock, below-target/margin sale, consignment due/overdue (cron), daily closing digest | 2 |
| 3b   | backend  | agent/backend/ops-backup        | daily encrypted DB backup job (pg_dump + age/gpg, retention), restore runbook | 1 |
| F1   | frontend | agent/frontend/foundation       | FSD skeleton, shadcn in shared/ui, providers, router + permission layout, http client, auth store, login, shell, i18n keys | Gemini's shadcn setup committed |
| F2   | frontend | agent/frontend/inventory, …/pos, …/consignment, …/finance | one slice set per wave-2 server module | F1 + matching 2x |
| G    | Gemini (user-piloted) | —                  | shadcn into `shared/ui`; Uzbek copy for each landed frontend wave   | F* |
| S    | security-auditor | —                       | after wave 1 (auth) and before first release                         | 1, 3 |

Cross-cutting (wave 1 owns the mechanism, every later wave applies it):
- Cost/profit redaction: a response interceptor strips acquisitionCost/landedCost/netProfit fields unless the user has `device.cost.view` / `sale.profit.view`. Built in wave 1 `common/`, applied by 2a/2b/2d.
- POS hardware: scanners act as HID keyboards (no server work); receipt/label printing is a client concern in F2 POS using the receipt payload from 2b.

Open decisions for the user (PRD guardian GAPs):
- DEFECTIVE → SOLD directly ("cleared for discounted sale", PRD Module 1)? Default until decided: require DEFECTIVE → IN_STOCK (with QC pass) before checkout.

Device status codes: IN_STOCK → (qc fail) DEFECTIVE → IN_STOCK; IN_STOCK → CONSIGNED → (settle) SOLD | (return) IN_STOCK; IN_STOCK → SOLD; SOLD → (warranty return) IN_STOCK/DEFECTIVE.
