# Repairs completion plan (Change 13)

Created: 2026-11-08. Owner: implementation session. Track progress in the
checkpoint table; every checkpoint is one focused commit with an explicit file
list, so unrelated in-progress work never enters a repairs commit.

## Decisions (confirmed by the user, 2026-11-08)

- Ship an idempotent dev seed **and run it** on `mobile_erp_main`.
- Keep `repair.read` / `repair.manage` / `repair.payment` **ADMIN-only** (ADR 0040).
  Cashiers get access only through explicit user permission overrides.
- Build **web offline outbox + server sync handlers** and **optional
  `Repair.deviceId` linkage**; document the remaining exceptions (mobile
  online-only, free-text phone when no device matches) as ADR amendments.
- Mobile parity (iOS/Android edit ticket, print/share, customer repair list) is
  a listed backlog item, not silently dropped.

## Baseline (before work)

- Client: `pnpm test` 134/134 pass, `tsc --noEmit` clean (customs work uncommitted).
- Server repairs: 6 suites / 30 tests pass.
- Dev DB: `repairs` / `repair_parts` / `repair_payments` / `repair_status_history`
  all 0 rows; `repairsEnabled` true in Main store, false in Branch 2; only ADMIN
  has `repair.*`; 0 QUANTITY device models; 5 English-labelled statuses.

## Checkpoints

| CP | Status | Scope | Commit |
|----|--------|-------|--------|
| 0 | done | This plan + baseline | `docs(repairs): completion plan and checkpoints` |
| 1 | done | `server/prisma/seed.repairs-dev.sql` (idempotent): enable flag on both stores, Uzbek status labels, one QUANTITY part model + stock, one demo ticket; run on dev DB | `feat(repairs): dev readiness seed` |
| 2 | pending | Server safety: `Repair.version` optimistic lock, idempotency keys for payments/parts, terminal guards for refund/outside, `outsideCost` cap, update XOR+FK validation inside tx, customer upsert inside tx, report store-scope fix, unit tests | `fix(repairs): atomic, idempotent, guarded writes` |
| 3 | pending | Client correctness: outsideCost data-loss fix, `repair.manage` gate on status actions, master clear, error/retry states everywhere, settings gate + `REPAIRS_DISABLED` mapping, ticket numbers in dialogs, overpaid copy, pagination, ticket deep links, customer row opens ticket, specs | `fix(repairs): correctness, states and navigation` |
| 4 | pending | Optional `Repair.deviceId` FK + migration, IMEI lookup in ticket form, device drawer link, defective-device repair action, tests | `feat(repairs): optional inventory device linkage` |
| 5 | pending | Web outbox mutation types + queueing on network failure; server sync handlers reusing idempotency keys; specs | `feat(repairs): offline outbox and sync handlers` |
| 6 | pending | Telegram owner notifications on repair events, repair income/profit line in daily closing report + digest, share/copy ticket action, POS shortcut | `feat(repairs): notifications, digest and till shortcut` |
| 7 | pending | PRD repairs section, ADR amendments (mobile online-only, free-text fallback), stale README/i18n cleanup, status labels | `docs(repairs): PRD, ADR amendments and copy cleanup` |
| 8 | pending | Full verification (`tsc`, `oxlint`, client + server tests, build), update this table, list mobile backlog with exact files | `chore(repairs): final verification and backlog` |

## Out of scope / needs external input

- SMS gateway or customer Telegram chat IDs (no such channel exists in the
  product). Notifications target the owner chat; the printable ticket is the
  customer copy. A customer messaging channel requires provider credentials.
- Native iOS/Android simulator builds and screenshot verification (no simulator
  run available in this harness). Mobile code changes are compiled by their own
  CI, not here.
- Changing the append-only ledger or status history rules (ADR 0028/0040).

## Progress log

- CP0: plan written, baseline recorded.
- CP1: seed script added, `pnpm seed:repairs-dev` run twice on `mobile_erp_main`
  (idempotent). Verified: both stores enabled, 5 Uzbek status labels, 1 QUANTITY
  model with 2 stock movements, 1 RECEIVED demo ticket with its history row.
