# 0029 — Product kinds and serial units

Date: 2026-11-05
Status: Accepted

## Context

The shop sells more than phones: consoles/laptops/watches (one unit per serial
number) and accessories counted by quantity. The catalog and the unit table
only understood IMEI phones. (Change 8 first half; not yet in the PRD — the user
owns that file.)

## Decision

- Lookup `product_kinds` (`IMEI`, `SERIAL`, `QUANTITY`; inserted by the migration
  **and** seed, since Railway runs only `migrate deploy`). `DeviceModel.kindCode`
  FK defaults to `IMEI`; existing models become `IMEI`. A model's kind cannot
  change once it has units. Tables are **not** renamed: `device_models` is the
  catalog, `devices` the unit table. The catalog model moved to `catalog.prisma`
  (inventory.prisma was at its 150-line limit).
- Catalog gains `categoryId` (optional FK to user-managed `product_categories`,
  its own CRUD guarded by the model permissions — no new permission code),
  `barcode` (optional, unique) and `modelCode` (optional, indexed).
- `Device.serialNumber` (optional, unique, 3-64 chars, trimmed/upper-cased, no
  spaces); `Device.imei` is now nullable. A DB CHECK enforces exactly one of
  imei/serialNumber, and no imei2 on a serial unit; the service raises the clean
  400 first. A unit's kind is derived from its model, never stored on the unit.
- One lookup, `devices/lib/unit-code.ts`: `unitCodeWhere(code)` tries imei, imei2
  then serialNumber; `resolveUnitCode({imei?,serialNumber?})` takes exactly one.
  Every by-code read (checkout, consignment create, sync handlers, device/QC
  search, warranty) uses it. Request bodies keep `imei` and additionally accept
  `serialNumber`; responses carrying `imei` gain `serialNumber` and `kindCode`.
- Intake/sale of a `QUANTITY` model is rejected 400; an IMEI model needs an imei
  and no serial, a SERIAL model a serial and no imei/imei2. Serial units flow
  through QC, consignment, checkout, returns, ledger and reports unchanged.

## Consequences

- Quantity stock, purchase and sale are the next task: the kind is seeded and a
  product may be created with it, but no quantity stock exists yet.
- `imei` is nullable everywhere; by-code reads moved from `anyImeiWhere` to
  `unitCodeWhere`. Telegram/report rows show the serial when the imei is null
  (the "IMEI" label wording is Uzbek copy, left to Gemini).
