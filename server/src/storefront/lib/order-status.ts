import { BadRequestException } from '@nestjs/common';

export const TERMINAL_ORDER_STATUSES = ['DONE', 'CANCELLED'] as const;

export function isTerminalOrderStatus(status: string): boolean {
  return (TERMINAL_ORDER_STATUSES as readonly string[]).includes(status);
}

/**
 * Returns allowed next statuses given current status and fulfillment method.
 * SHIPPED is only allowed for DELIVERY orders, between CONTACTED and DONE.
 */
export function allowedNextOrderStatuses(
  currentStatus: string,
  fulfillmentMethod: string,
): string[] {
  if (isTerminalOrderStatus(currentStatus)) {
    return [];
  }

  const isDelivery = fulfillmentMethod.toUpperCase() === 'DELIVERY';

  if (currentStatus === 'NEW') {
    return ['CONTACTED', 'CANCELLED'];
  }

  if (currentStatus === 'CONTACTED') {
    return isDelivery
      ? ['SHIPPED', 'DONE', 'CANCELLED']
      : ['DONE', 'CANCELLED'];
  }

  if (currentStatus === 'SHIPPED') {
    return ['DONE', 'CANCELLED'];
  }

  return [];
}

export function assertValidTransition(
  currentStatus: string,
  nextStatus: string,
  fulfillmentMethod = 'PICKUP',
): void {
  if (isTerminalOrderStatus(currentStatus)) {
    throw new BadRequestException({
      code: 'ORDER_TERMINAL',
      message: 'A terminal order cannot be changed',
    });
  }

  const allowed = allowedNextOrderStatuses(currentStatus, fulfillmentMethod);
  if (!allowed.includes(nextStatus)) {
    throw new BadRequestException({
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot transition ${fulfillmentMethod} order from ${currentStatus} to ${nextStatus}`,
    });
  }
}
