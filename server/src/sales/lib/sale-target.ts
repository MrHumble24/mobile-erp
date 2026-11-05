import { BadRequestException } from '@nestjs/common';
import { resolveUnitCode } from '../../devices/lib/unit-code.js';

/** What a sale is for: one unit (by code) or N pieces of a quantity product. */
export type SaleTarget =
  | { kind: 'unit'; code: string }
  | { kind: 'quantity'; modelId: string; quantity: number };

/**
 * The three ways to say what is sold — `imei`, `serialNumber`, or
 * (`modelId` + `quantity`) — are mutually exclusive; exactly one must be used
 * (ADR 0029/0030). A quantity sale needs both `modelId` and `quantity`.
 */
export function resolveSaleTarget(input: {
  imei?: string | null;
  serialNumber?: string | null;
  modelId?: string | null;
  quantity?: number | null;
}): SaleTarget {
  const hasModel = input.modelId != null && input.modelId !== '';
  const hasQty = input.quantity != null;
  if (hasModel || hasQty) {
    if (
      (input.imei != null && input.imei !== '') ||
      (input.serialNumber != null && input.serialNumber !== '')
    ) {
      throw new BadRequestException(
        'Provide a unit (imei/serialNumber) or a quantity product (modelId+quantity), not both',
      );
    }
    if (!(hasModel && hasQty)) {
      throw new BadRequestException(
        'A quantity sale needs both modelId and quantity',
      );
    }
    return {
      kind: 'quantity',
      modelId: input.modelId!,
      quantity: input.quantity!,
    };
  }
  // Unit sale: exactly one of imei/serialNumber (reused resolver).
  return { kind: 'unit', code: resolveUnitCode(input) };
}
