# entity: device

The inventory unit: an IMEI-identified phone with specs, status, pricing and QC.

## Owns
- `device.types.ts` — `DeviceView` / `DeviceDetailView` (incl. optional dual-SIM
  `imei2` and the cost-restricted `customsFee` / `unitExpense` / `unitExpenseNote`),
  filters, DTOs (`EditExpenseDto`, `EditCustomsFeeDto`).
- `api/` — `deviceRepository` (list, by-imei, by-id, history, update, status,
  editExpense, editCustomsFee), `deviceKeys` factory. `getByImei` falls back to
  the offline cache on network failure (`lib/cached-device.ts`).
- `model/` — `useDevices`, `useDeviceByImei`, `useDeviceHistory`,
  `useUpdateDevice`, `useChangeDeviceStatus`, `useEditDeviceExpense`,
  `useEditDeviceCustomsFee` (ADR 0026/0027); status-transition + storage tables.
- `lib/imei.ts` — the single IMEI format rule: `IMEI_REGEX` (15 digits),
  `isImei`, and `matchesImei(device, code)` (matches `imei` or `imei2`).
- `ui/` — `DeviceTable` / `DeviceTableRow` (IMEI 2 as a secondary line when
  present), `DeviceStatusBadge`.

## Public API
- Types, `deviceRepository`, `deviceKeys`, the hooks above, `DeviceTable`,
  `DeviceStatusBadge`, `STORAGE_OPTIONS`, `IMEI_REGEX` / `isImei` / `matchesImei`.

## Invariants
- A device has one primary `imei` and an optional second `imei2` (dual-SIM); any
  by-IMEI match must use `matchesImei`, never `device.imei === code`, so a scan
  of either number resolves. The server matches both; the offline cache is keyed
  by primary imei and scans for an `imei2` hit.

## Must never
- Hold server state outside React Query, or talk HTTP outside the repository.
