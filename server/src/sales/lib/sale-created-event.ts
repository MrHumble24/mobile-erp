import { Prisma } from '../../generated/client/client.js';
import { SaleCreatedEvent } from '../../telegram/events/telegram-events.js';
import type { SaleView } from '../types/sale.types.js';

/** Build the Telegram sale-created event from a sale view and its device cost. */
export function buildSaleCreatedEvent(
  view: SaleView,
  salePrice: number,
  device: { landedCost: Prisma.Decimal; targetPrice: Prisma.Decimal | null },
): SaleCreatedEvent {
  return new SaleCreatedEvent(
    view.id,
    view.device?.imei ?? view.device?.serialNumber ?? '',
    `${view.device?.model.brand ?? ''} ${view.device?.model.name ?? ''}`.trim(),
    salePrice,
    device.targetPrice === null ? null : Number(device.targetPrice),
    Number(device.landedCost),
  );
}
