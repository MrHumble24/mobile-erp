import type { DeviceStatus } from "./device.types"

/**
 * Status changes a user may trigger manually from the inventory drawer.
 * CONSIGNED and SOLD targets are reached through POS / Nasiya, never here,
 * so they are deliberately absent even though the server allows them.
 */
export const MANUAL_STATUS_TRANSITIONS: Record<string, DeviceStatus[]> = {
  IN_STOCK: ["DEFECTIVE"],
  DEFECTIVE: ["IN_STOCK"],
  SOLD: ["IN_STOCK", "DEFECTIVE"],
  CONSIGNED: [],
}

export function manualTransitionsFor(status: string): DeviceStatus[] {
  return MANUAL_STATUS_TRANSITIONS[status] ?? []
}
