import type { Prisma } from '../../generated/client/client.js';

/** The one IMEI format rule: exactly 15 numeric digits. Imported by every DTO. */
export const IMEI_REGEX = /^\d{15}$/;
export const IMEI_MESSAGE = 'imei must be exactly 15 digits';

/**
 * Prisma filter matching a device on either IMEI column (dual-SIM units carry
 * a second IMEI). The single source of truth for every by-IMEI lookup.
 */
export function anyImeiWhere(imei: string): Prisma.DeviceWhereInput {
  return { OR: [{ imei }, { imei2: imei }] };
}
