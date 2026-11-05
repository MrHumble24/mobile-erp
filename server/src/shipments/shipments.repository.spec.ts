import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShipmentsRepository } from './shipments.repository.js';
import type { RegisterDeviceInput } from './types/shipment.types.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function build() {
  let created = 0;
  const tx = {
    device: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(() => {
        created += 1;
        return Promise.resolve({
          id: `dev-${created}`,
          statusCode: 'IN_STOCK',
        });
      }),
    },
    shipment: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        storeId: 'ship-store',
        paymentAccountCode: 'CARD',
      }),
    },
  };
  const shipmentRow = {
    id: 'ship-1',
    supplierId: 'sup-1',
    shipmentDate: new Date(),
    expectedCount: 2,
    paymentAccountCode: 'CARD',
    notes: null,
    createdById: 'qc-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { devices: 0 },
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
    shipment: {
      update: jest.fn().mockResolvedValue(shipmentRow),
      findUniqueOrThrow: jest.fn().mockResolvedValue(shipmentRow),
    },
    device: {
      groupBy: jest.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaService;
  const ledger = { post: jest.fn() } as unknown as LedgerService;
  return { repo: new ShipmentsRepository(prisma, ledger), ledger, prisma };
}

const device = (
  imei: string,
  cost: number,
  extra: Partial<RegisterDeviceInput> = {},
): RegisterDeviceInput => ({
  imei,
  modelId: 'model-1',
  specs: {},
  acquisitionCost: cost,
  ...extra,
});

describe('ShipmentsRepository.addDevices', () => {
  it('posts one PURCHASE per device against the shipment account', async () => {
    const { repo, ledger } = build();
    await repo.addDevices(
      'ship-1',
      [device('111111111111111', 300), device('222222222222222', 500)],
      'qc-1',
      'ship-store',
    );
    expect(ledger.post).toHaveBeenCalledTimes(2);
    expect(ledger.post).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        typeCode: 'PURCHASE',
        accountCode: 'CARD',
        amount: D('-300'),
        deviceId: 'dev-1',
        shipmentId: 'ship-1',
      }),
      expect.anything(),
    );
  });

  it('posts a DEVICE_EXPENSE on top when unitExpense > 0', async () => {
    const { repo, ledger } = build();
    const [view] = await repo.addDevices(
      'ship-1',
      [device('111111111111111', 300, { unitExpense: 40 })],
      'qc-1',
      'ship-store',
    );
    expect(view.landedCost).toBe('340.00');
    expect(ledger.post).toHaveBeenCalledTimes(2);
    expect(ledger.post).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        typeCode: 'DEVICE_EXPENSE',
        accountCode: 'CARD',
        amount: D('-40'),
        deviceId: 'dev-1',
      }),
      expect.anything(),
    );
  });

  it('posts no DEVICE_EXPENSE when unitExpense is zero', async () => {
    const { repo, ledger } = build();
    await repo.addDevices(
      'ship-1',
      [device('111111111111111', 300, { unitExpense: 0 })],
      'qc-1',
      'ship-store',
    );
    expect(ledger.post).toHaveBeenCalledTimes(1);
  });
});

describe('ShipmentsRepository.update', () => {
  it('posts nothing to the ledger (the shipment has no money of its own)', async () => {
    const { repo, ledger } = build();
    await repo.update('ship-1', { notes: 'x' });
    expect(ledger.post).not.toHaveBeenCalled();
  });
});
