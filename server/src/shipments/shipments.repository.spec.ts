import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShipmentsRepository } from './shipments.repository.js';
import type { RegisterDeviceInput } from './types/shipment.types.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function build(txOverrides: Record<string, unknown> = {}) {
  let created = 0;
  const tx = {
    device: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(() => {
        created += 1;
        return Promise.resolve({ id: `dev-${created}` });
      }),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    },
    shipment: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        storeId: 'ship-store',
        paymentAccountCode: 'CARD',
        overheadCost: D(100),
        _count: { devices: 0 },
      }),
      update: jest.fn(),
    },
    ...txOverrides,
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  const ledger = { post: jest.fn() } as unknown as LedgerService;
  return { repo: new ShipmentsRepository(prisma, ledger), ledger, tx };
}

const device = (imei: string, cost: number): RegisterDeviceInput => ({
  imei,
  modelId: 'model-1',
  specs: {},
  acquisitionCost: cost,
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
    expect(ledger.post).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ amount: D('-500'), deviceId: 'dev-2' }),
      expect.anything(),
    );
  });
});

describe('ShipmentsRepository.update', () => {
  it('posts the OVERHEAD difference when overhead changes', async () => {
    const { repo, ledger } = build();
    await repo.update('ship-1', { overheadCost: 160 }, 'qc-1');
    // old 100 -> new 160: delta = -(160-100) = -60 (more money out).
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'OVERHEAD',
        accountCode: 'CARD',
        amount: D('-60'),
        shipmentId: 'ship-1',
      }),
      expect.anything(),
    );
  });

  it('posts nothing when overhead is unchanged', async () => {
    const { repo, ledger } = build();
    await repo.update('ship-1', { notes: 'x' }, 'qc-1');
    expect(ledger.post).not.toHaveBeenCalled();
  });
});
