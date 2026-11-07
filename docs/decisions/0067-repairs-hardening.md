# 0067 — Repairs hardening (Change 13)

Date: 2026-11-08
Status: Accepted

## Context

ADRs 0040 (server) and 0042 (client) shipped the repairs slice, but left a set
of correctness, offline and parity gaps. Change 13 closes those gaps in one
tracked program (`docs/plan/repairs-completion.md`, CP1–CP8), each checkpoint a
focused change with an explicit file list. The feature shape (optional flag,
state machine, derived money, ADMIN-only permissions) is unchanged; this ADR
records the hardening scope, the verification commands and the accepted
exceptions.

## Decision

Eight checkpoints:

1. **CP1 — Dev readiness seed.** Idempotent
   `server/prisma/seed.repairs-dev.sql`: enable the flag on both stores, Uzbek
   status labels, one QUANTITY part model + stock movements, one demo ticket;
   run on `mobile_erp_main`.
2. **CP2 — Server safety.** `Repair.version` optimistic lock,
   `repair_mutations` idempotency keys for all writes, terminal guards on
   refund/outside, an `outsideCost` cap, update XOR + FK validation inside the
   transaction, customer upsert inside the create transaction, report
   store-scope fix, unit tests.
3. **CP3 — Client correctness.** `outsideCost` data-loss fix, `repair.manage`
   gate on status actions, master clear, error/retry states everywhere,
   settings gate + `REPAIRS_DISABLED` mapping, ticket numbers in dialogs,
   overpaid copy, pagination, ticket deep links, customer row opens ticket,
   specs.
4. **CP4 — Optional `Repair.deviceId` linkage.** FK + migration, IMEI lookup
   in the ticket form, device drawer link, defective-device repair action,
   tests.
5. **CP5 — Web offline outbox + server sync handlers.** 8 repair mutation
   types queued on a transport failure with a `clientMutationId`; 8 server
   sync handlers replay through the same idempotency keys (`repair.create`,
   `repair.update`, `repair.status`, `repair.payment`, `repair.refund`,
   `repair.outside`, `repair.part.add`, `repair.part.remove`).
6. **CP6 — Owner notifications, digest and till shortcut.** Telegram owner
   notifications on repair events, a repair income/profit line in the daily
   closing report + digest, a POS shortcut. (The share/copy ticket action
   shipped earlier with CP3's printable-ticket navigation.)
7. **CP7 — Documentation.** PRD repairs section, ADR 0040/0042 amendments,
   stale README / i18n cleanup, status labels.
8. **CP8 — Verification & backlog.** Full verification, plan-table update and
   an exact-file mobile backlog list.

### Verification

```sh
# server (run from server/)
pnpm seed:repairs-dev                          # CP1, idempotent
pnpm exec jest src/sync/handlers src/repairs  # CP2 + CP5 suites
pnpm test                                     # full jest
pnpm build                                    # prisma generate && nest build

# client (run from client/)
pnpm exec tsc --noEmit
pnpm lint                                      # oxlint
pnpm test
pnpm build                                     # tsc -b && vite build
```

## Consequences

- Writes are atomic, idempotent and version-checked; web repair mutations work
  offline and replay safely on reconnect.
- Accepted exceptions (see the ADR 0040/0042 amendments): native mobile repairs
  are ONLINE ONLY, and free-text phone stays when no inventory device matches.

### Out of scope

- A customer messaging provider (SMS gateway or customer Telegram chat IDs) —
  none exists in the product. Notifications target the owner chat and the
  printable/shareable ticket is the customer copy.
- Mobile offline support for repair tickets (a native offline ticket store).
- Mobile edit/print parity: editing a ticket, printing/sharing a ticket and a
  customer repair list on iOS/Android, plus the iOS `repairs.*` key mismatch
  with the now-bundled web namespace.
