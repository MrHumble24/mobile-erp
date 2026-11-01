# Build waves (derived from prisma/schema/*.prisma, PRD modules)

Order follows data dependencies: identity/access → inventory → money flows → UI.
One agent per package per wave; wave N+1 starts after wave N is merged to `main`.
Shared files in a wave: only `server/src/app.module.ts` (one import line per agent).

| Wave | Agent    | Branch                          | Scope (server modules)                                              | Depends on |
|------|----------|---------------------------------|----------------------------------------------------------------------|------------|
| 1    | backend  | agent/backend/foundation        | common (pipes, filters, guards, decorators), auth, users+profile, access (roles, permissions, user overrides, effective set), bootstrap first admin | schema |
| 1    | prd-guardian | —                           | verify this plan against PRD                                         | — |
| 2a   | backend  | agent/backend/inventory         | suppliers, shipments, device-models, devices (specs JSONB, landed cost), status history, qc (inspections, defects, grades), stock-alert-rules | 1 |
| 2b   | backend  | agent/backend/sales             | customers, sales (retail checkout, landed-cost snapshot, idempotency), warranties, returns | 1 |
| 2c   | backend  | agent/backend/consignment       | partners, consignments, partner payments, balances, settle/return → sale | 1 |
| 2d   | backend  | agent/backend/expenses-settings | expense categories, expenses, store settings, reports (profit, expenses) | 1 |
| 3    | backend  | agent/backend/sync-telegram     | offline sync endpoint (mutation queue, version check, conflicts), Telegram notifications, daily digest | 2 |
| F1   | frontend | agent/frontend/foundation       | FSD skeleton, shadcn in shared/ui, providers, router + permission layout, http client, auth store, login, shell, i18n keys | Gemini's shadcn setup committed |
| F2   | frontend | agent/frontend/inventory, …/pos, …/consignment, …/finance | one slice set per wave-2 server module | F1 + matching 2x |
| G    | Gemini (user-piloted) | —                  | shadcn into `shared/ui`; Uzbek copy for each landed frontend wave   | F* |
| S    | security-auditor | —                       | after wave 1 (auth) and before first release                         | 1, 3 |

Device status codes: IN_STOCK → (qc fail) DEFECTIVE → IN_STOCK; IN_STOCK → CONSIGNED → (settle) SOLD | (return) IN_STOCK; IN_STOCK → SOLD; SOLD → (warranty return) IN_STOCK/DEFECTIVE.
