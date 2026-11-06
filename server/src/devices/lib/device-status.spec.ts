import {
  isDeviceOwned,
  isDeviceSellable,
  OWNED_DEVICE_STATUSES,
  SELLABLE_DEVICE_STATUSES,
} from './device-status.js';

describe('device-status helpers', () => {
  it('identifies owned device statuses', () => {
    expect(OWNED_DEVICE_STATUSES).toContain('IN_STOCK');
    expect(OWNED_DEVICE_STATUSES).toContain('RESERVED');
    expect(isDeviceOwned('IN_STOCK')).toBe(true);
    expect(isDeviceOwned('RESERVED')).toBe(true);
    expect(isDeviceOwned('SOLD')).toBe(false);
    expect(isDeviceOwned('DEFECTIVE')).toBe(false);
    expect(isDeviceOwned('IN_TRANSIT')).toBe(false);
  });

  it('identifies sellable device statuses', () => {
    expect(SELLABLE_DEVICE_STATUSES).toContain('IN_STOCK');
    expect(SELLABLE_DEVICE_STATUSES).not.toContain('RESERVED');
    expect(isDeviceSellable('IN_STOCK')).toBe(true);
    expect(isDeviceSellable('RESERVED')).toBe(false);
    expect(isDeviceSellable('SOLD')).toBe(false);
  });
});
