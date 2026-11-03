# 0021 — Optional second IMEI (dual-SIM)

Date: 2026-11-03
Status: Accepted

## Context

Dual-SIM phones carry two IMEIs. Either one may be scanned at the counter, in
QC, during a consignment hand-off or an offline sync. The schema and every
by-IMEI lookup assumed a single `imei` column, so a unit scanned by its second
IMEI could not be found and could be registered twice.

## Decision

- `Device` gains `imei2 String? @unique @db.VarChar(15)`. A migration CHECK
  (`devices_imei2_ne_imei`) backstops `imei2 <> imei`; the service raises the
  clean 400/409 before the DB is hit.
- One source of IMEI knowledge: `devices/lib/imei.ts` exports `IMEI_REGEX`/
  `IMEI_MESSAGE` (imported by every DTO, replacing three inline regexes) and
  `anyImeiWhere(value)` → `{ OR: [{ imei }, { imei2 }] }`. Every by-IMEI lookup
  (devices by-imei, sale/consignment/QC/warranty/sync) uses it, via `findFirst`.
- Uniqueness is enforced across **both** columns: intake and device update
  reject a value already present in either column of any other unit, and reject
  a unit whose two IMEIs are equal. Single-column unique indexes cannot see
  cross-column clashes, so an explicit pre-check does.
- `imei2: string | null` is added to every device-bearing response (device
  list/detail, sale lines, receipt, consignment lines, QC queue, sync feed,
  conflicts) and search matches both columns.

## Consequences

- By-IMEI reads moved from `findUnique` to `findFirst` (the OR is not a unique
  key). Negligible cost; both columns are uniquely indexed.
- Devices are not seeded in `seed.sql`, so no seed data changed.
- PRD §Module 2 "unique 15-digit IMEI" needs the user's edit to reflect the
  optional second IMEI (agents do not edit the PRD).
