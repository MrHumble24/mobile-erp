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
 * Per-kind intake rules (kind comes from the model, ADR 0029): a QUANTITY
 * product is not stocked as a unit; a SERIAL unit needs a `serialNumber` and no
 * IMEI; an IMEI unit needs an `imei` and no `serialNumber`. Shared by shipment
 * intake and customer purchases so the rule lives in one place.
 */
export function assertUnitKind(
  kind: string,
  input: {
    imei?: string | null;
    imei2?: string | null;
    serialNumber?: string | null;
  },
): void {
  if (kind === 'QUANTITY') {
    throw new BadRequestException(
      'Quantity products are not stocked as units; use quantity stock',
    );
  }
  if (kind === 'SERIAL') {
    if (!input.serialNumber) {
      throw new BadRequestException('A serial product requires a serialNumber');
    }
    if (input.imei || input.imei2) {
      throw new BadRequestException('A serial product must not carry an IMEI');
    }
    return;
  }
  if (!input.imei) {
    throw new BadRequestException('An IMEI product requires an imei');
  }
  if (input.serialNumber) {
    throw new BadRequestException(
      'An IMEI product must not carry a serialNumber',
    );
  }
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
