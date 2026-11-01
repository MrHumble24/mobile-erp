import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import { SalesService } from './sales.service.js';

const caller: AuthenticatedUser = {
  id: 'cashier-1',
  email: 'c@x',
  permissions: new Set(['sale.create']),
};

function build(readsOverrides: Partial<Record<string, jest.Mock>> = {}) {
  const reads = {
    findByClientMutationId: jest.fn().mockResolvedValue(null),
    findDeviceByImei: jest.fn().mockResolvedValue({
      id: 'dev-1',
      statusCode: 'IN_STOCK',
      version: 3,
      landedCost: 100,
    }),
    customerExists: jest.fn().mockResolvedValue(true),
    defaultWarrantyDays: jest.fn().mockResolvedValue(14),
    findById: jest.fn().mockResolvedValue({ id: 'sale-1' }),
    ...readsOverrides,
  };
  const checkout = { checkout: jest.fn().mockResolvedValue('sale-1') };
  const service = new SalesService(
    reads as unknown as SalesRepository,
    checkout as unknown as SalesCheckoutRepository,
  );
  return { service, reads, checkout };
}

describe('SalesService.create', () => {
  const dto = { imei: '123456789012345', salePrice: 250 } as never;

  it('is idempotent: returns the existing sale and skips checkout', async () => {
    const existing = { id: 'sale-prev' };
    const { service, checkout } = build({
      findByClientMutationId: jest.fn().mockResolvedValue(existing),
    });
    const result = await service.create(caller, {
      ...(dto as object),
      clientMutationId: 'm-1',
    } as never);
    expect(result).toBe(existing);
    expect(checkout.checkout).not.toHaveBeenCalled();
  });

  it('rejects a device that is not IN_STOCK', async () => {
    const { service, checkout } = build({
      findDeviceByImei: jest.fn().mockResolvedValue({
        id: 'dev-1',
        statusCode: 'DEFECTIVE',
        version: 1,
        landedCost: 100,
      }),
    });
    await expect(service.create(caller, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(checkout.checkout).not.toHaveBeenCalled();
  });

  it('rejects a missing device', async () => {
    const { service } = build({
      findDeviceByImei: jest.fn().mockResolvedValue(null),
    });
    await expect(service.create(caller, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('snapshots landed cost and the current cashier on checkout', async () => {
    const { service, checkout } = build();
    await service.create(caller, dto);
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'dev-1',
        expectedVersion: 3,
        landedCostSnapshot: 100,
        soldById: 'cashier-1',
        warranty: expect.objectContaining({ days: 14 }),
      }),
    );
  });
});
