export type {
  DeviceView,
  DeviceDetailView,
  QcInspectionSummary,
  DeviceStatusHistoryView,
  PaginatedDevices,
  DeviceFilters,
  DeviceStatus,
  DeviceSpecs,
  UpdateDeviceDto,
  ChangeStatusDto,
  EditExpenseDto,
  EditCustomsFeeDto,
} from "./model/device.types"
export { deviceRepository } from "./api/device.repository"
export { deviceKeys } from "./api/device.keys"
export { useDevices } from "./model/use-devices"
export { useDeviceByImei } from "./model/use-device-by-imei"
export { useDeviceHistory } from "./model/use-device-history"
export {
  useChangeDeviceStatus,
  useUpdateDevice,
  useEditDeviceExpense,
  useEditDeviceCustomsFee,
} from "./model/use-change-device-status"
export { DeviceStatusBadge } from "./ui/DeviceStatusBadge"
export { DeviceTable } from "./ui/DeviceTable"
export { STORAGE_OPTIONS, type StorageOption } from "./model/device-storage"
export { IMEI_REGEX, isImei, matchesUnitCode } from "./lib/imei"
export { SERIAL_REGEX, normalizeSerial, isSerial, codeToIdentifier } from "./lib/unit-code"
export { getCachedDeviceByCode } from "./lib/cached-device"
export { MANUAL_STATUS_TRANSITIONS, manualTransitionsFor } from "./model/device-transitions"
