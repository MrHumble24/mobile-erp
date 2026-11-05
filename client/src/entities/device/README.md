# entity: device

The inventory unit: a phone (IMEI) or a serial-numbered device (ADR 0029), with
specs, status, pricing and QC. Exactly one of `imei` / `serialNumber` is set.

## Owns
- `device.types.ts` — `DeviceView` / `DeviceDetailView` (nullable `imei`, optional
  dual-SIM `imei2`, `serialNumber`, `model.kindCode`, and the cost-restricted
  `customsFee` / `unitExpense` / `unitExpenseNote`), filters, DTOs.
- `api/` — `deviceRepository` (list, by-imei, by-id, history, update, status,
  editExpense, editCustomsFee), `deviceKeys` factory. `getByImei`/`by-imei/:code`
  resolves any unit code (imei, imei2 or serial); it falls back to the offline
  cache on network failure (`lib/cached-device.ts`, keyed by device id).
- `model/` — `useDevices`, `useDeviceByImei` (enabled for any code ≥3 chars),
  `useDeviceHistory`, `useUpdateDevice`, `useChangeDeviceStatus`,
  `useEditDeviceExpense`, `useEditDeviceCustomsFee`.
- `lib/imei.ts` — `IMEI_REGEX` (15 digits), `isImei`, `matchesUnitCode(device,
  code)` (matches imei, imei2 or serial, case-insensitive).
- `lib/unit-code.ts` — serial rules: `SERIAL_REGEX`, `normalizeSerial`,
  `isSerial`, and `codeToIdentifier(code)` → `{imei}` or `{serialNumber}` for a
  write. (Display of the one code lives in `shared/lib/unit-code.ts::unitCode`.)
- `ui/` — `DeviceTable` / `DeviceTableRow`, `DeviceStatusBadge`.

## Public API
- Types, `deviceRepository`, `deviceKeys`, the hooks above, `DeviceTable`,
  `DeviceStatusBadge`, `STORAGE_OPTIONS`, `IMEI_REGEX` / `isImei` /
  `matchesUnitCode`, `SERIAL_REGEX` / `normalizeSerial` / `isSerial` /
  `codeToIdentifier`.

## Invariants
- A unit carries exactly one of `imei` / `serialNumber`; never assume `imei`.
  Any by-code match uses `matchesUnitCode`, never `device.imei === code`. The
  server resolves imei/imei2/serial; the offline cache (keyed by device id)
  scans all three.

## Must never
- Hold server state outside React Query, or talk HTTP outside the repository.
