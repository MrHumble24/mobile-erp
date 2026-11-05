import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '../../generated/client/client.js';

/** A serial number after normalisation: 3-64 chars, no whitespace. */
export const SERIAL_REGEX = /^\S{3,64}$/;
export const SERIAL_MESSAGE =
  'serialNumber must be 3-64 characters with no spaces';

/** Trim and upper-case a serial so lookup and storage always agree. */
export function normalizeSerial(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidSerial(value: string): boolean {
  return SERIAL_REGEX.test(value);
}

/**
 * The one lookup from a scanned or typed code: tries IMEI, then the second
 * IMEI, then the serial number. Serial is matched upper-cased (how it is
 * stored). Every by-code device read across modules goes through this.
 */
export function unitCodeWhere(code: string): Prisma.DeviceWhereInput {
  const serial = normalizeSerial(code);
  return { OR: [{ imei: code }, { imei2: code }, { serialNumber: serial }] };
}

/**
 * Resolve the single unit code from a request that carries `imei` and/or
 * `serialNumber`; exactly one must be present (400 otherwise). A serial is
 * normalised; an imei is used as typed.
 */
export function resolveUnitCode(input: {
  imei?: string | null;
  serialNumber?: string | null;
}): string {
  const hasImei = input.imei != null && input.imei !== '';
  const hasSerial = input.serialNumber != null && input.serialNumber !== '';
  if (hasImei === hasSerial) {
    throw new BadRequestException(
      'Provide exactly one of imei or serialNumber',
    );
  }
  return hasImei ? input.imei! : normalizeSerial(input.serialNumber!);
}
