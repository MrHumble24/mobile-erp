import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShipmentsIntakeRepository } from './shipments-intake.repository.js';
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
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  const ledger = { post: jest.fn() } as unknown as LedgerService;
  return { repo: new ShipmentsIntakeRepository(prisma, ledger), ledger };
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

describe('ShipmentsIntakeRepository.addDevices', () => {
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

  it('posts CUSTOMS and DEVICE_EXPENSE on top and sums the landed cost', async () => {
    const { repo, ledger } = build();
    const [view] = await repo.addDevices(
      'ship-1',
      [device('111111111111111', 300, { customsFee: 20, unitExpense: 40 })],
      'qc-1',
      'ship-store',
    );
    expect(view.landedCost).toBe('360.00');
    expect(view.customsFee).toBe('20.00');
    expect(ledger.post).toHaveBeenCalledTimes(3);
    const types = (ledger.post as jest.Mock).mock.calls.map(
      (c) => c[0].typeCode,
    );
    expect(types).toEqual(['PURCHASE', 'CUSTOMS', 'DEVICE_EXPENSE']);
  });

  it('posts no CUSTOMS or DEVICE_EXPENSE when both are zero', async () => {
    const { repo, ledger } = build();
    await repo.addDevices(
      'ship-1',
      [device('111111111111111', 300)],
      'qc-1',
      'ship-store',
    );
    expect(ledger.post).toHaveBeenCalledTimes(1);
  });
});
