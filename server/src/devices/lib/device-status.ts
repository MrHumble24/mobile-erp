/**
 * Two distinct meanings of in-shop device status (033):
 *
 * 1. "Owned" (balance of goods, inventory valuation, stock counts):
 *    The unit belongs to the store. Includes RESERVED because holding a phone
 *    for an order does not change ownership or inventory value.
 *
 * 2. "Sellable" (till lookup, POS sales, public catalog, stock transfers, consignments):
 *    The unit can be offered to walk-in customers or moved. RESERVED units must
 *    NOT be offered or sold except through their specific storefront order.
 */

export const OWNED_DEVICE_STATUSES = ['IN_STOCK', 'RESERVED'] as const;
export type OwnedDeviceStatus = (typeof OWNED_DEVICE_STATUSES)[number];

export const SELLABLE_DEVICE_STATUSES = ['IN_STOCK'] as const;
export type SellableDeviceStatus = (typeof SELLABLE_DEVICE_STATUSES)[number];

export function isDeviceOwned(statusCode: string): boolean {
  return (OWNED_DEVICE_STATUSES as readonly string[]).includes(statusCode);
}

export function isDeviceSellable(statusCode: string): boolean {
  return (SELLABLE_DEVICE_STATUSES as readonly string[]).includes(statusCode);
}
