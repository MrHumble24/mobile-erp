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
  return { repo: new ShipmentsIntakeRepository(prisma, ledger), ledger, tx };
}

const device = (
  imei: string,
  cost: number,
  extra: Partial<RegisterDeviceInput> = {},
): RegisterDeviceInput => ({
  imei,
  modelId: 'model-1',
  kindCode: 'IMEI',
  specs: {},
  acquisitionCost: cost,
  ...extra,
});

const serialDevice = (
  serialNumber: string,
  cost = 300,
): RegisterDeviceInput => ({
  modelId: 'model-1',
  kindCode: 'SERIAL',
  serialNumber,
  specs: {},
  acquisitionCost: cost,
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

  it('stores a serial unit with null imei and the serial number', async () => {
    const { repo } = build();
    const [view] = await repo.addDevices(
      'ship-1',
      [serialDevice('SN-1')],
      'qc-1',
      'ship-store',
    );
    expect(view.imei).toBeNull();
    expect(view.serialNumber).toBe('SN-1');
    expect(view.kindCode).toBe('SERIAL');
  });

  it('rejects a duplicate serial number within the batch', async () => {
    const { repo } = build();
    await expect(
      repo.addDevices(
        'ship-1',
        [serialDevice('SN-1'), serialDevice('SN-1')],
        'qc-1',
        'ship-store',
      ),
    ).rejects.toThrow('Duplicate serial number within the batch');
  });

  it('rejects a serial already held by an existing unit', async () => {
    const { repo, tx } = build();
    tx.device.findFirst.mockResolvedValue({ serialNumber: 'SN-9' });
    await expect(
      repo.addDevices('ship-1', [serialDevice('SN-9')], 'q', 's'),
    ).rejects.toThrow('already exists');
  });
});
