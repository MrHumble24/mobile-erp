import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DevicesExpenseRepository } from './devices-expense.repository.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function deviceRow(unitExpense: number, landedCost: number) {
  return {
    id: 'd1',
    imei: '111111111111111',
    imei2: null,
    shipmentId: 'ship-1',
    modelId: 'm1',
    specs: {},
    acquisitionCost: D(300),
    unitExpense: D(unitExpense),
    unitExpenseNote: null,
    landedCost: D(landedCost),
    targetPrice: null,
    statusCode: 'IN_STOCK',
    intakeDate: new Date(),
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function build(beforeExpense: number) {
  const sale = { update: jest.fn(), updateMany: jest.fn() };
  const tx = {
    device: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        acquisitionCost: D(300),
        unitExpense: D(beforeExpense),
        shipmentId: 'ship-1',
        shipment: { storeId: 'store-1', paymentAccountCode: 'CASH' },
      }),
      update: jest
        .fn()
        .mockImplementation(({ data }: { data: { unitExpense: number } }) =>
          Promise.resolve(deviceRow(data.unitExpense, 300 + data.unitExpense)),
        ),
    },
    sale,
  };
  const prisma = {
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as unknown as PrismaService;
  const ledger = { post: jest.fn() } as unknown as LedgerService;
  return {
    repo: new DevicesExpenseRepository(prisma, ledger),
    ledger,
    tx,
    sale,
  };
}

describe('DevicesExpenseRepository.setExpense', () => {
  it('set from zero posts the whole amount out and recomputes landed cost', async () => {
    const { repo, ledger } = build(0);
    const view = await repo.setExpense('d1', 40, 'screen', 'user-1');
    expect(view.landedCost).toBe('340');
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'DEVICE_EXPENSE',
        accountCode: 'CASH',
        amount: D('-40'),
        deviceId: 'd1',
        shipmentId: 'ship-1',
      }),
      expect.anything(),
    );
  });

  it('raising posts only the increase out', async () => {
    const { repo, ledger } = build(40);
    await repo.setExpense('d1', 100, undefined, 'user-1');
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({ amount: D('-60') }),
      expect.anything(),
    );
  });

  it('lowering posts the decrease back in (positive)', async () => {
    const { repo, ledger } = build(100);
    await repo.setExpense('d1', 40, undefined, 'user-1');
    expect(ledger.post).toHaveBeenCalledWith(
      expect.objectContaining({ amount: D('60') }),
      expect.anything(),
    );
  });

  it('unchanged posts nothing', async () => {
    const { repo, ledger } = build(40);
    await repo.setExpense('d1', 40, undefined, 'user-1');
    expect(ledger.post).not.toHaveBeenCalled();
  });

  it('never touches a sale row (sold phones keep their landedCostSnapshot)', async () => {
    const { repo, sale } = build(0);
    await repo.setExpense('d1', 40, undefined, 'user-1');
    expect(sale.update).not.toHaveBeenCalled();
    expect(sale.updateMany).not.toHaveBeenCalled();
  });
});
