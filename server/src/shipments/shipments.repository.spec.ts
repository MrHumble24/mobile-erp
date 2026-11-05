import { PrismaService } from '../prisma/prisma.service.js';
import { ShipmentsRepository } from './shipments.repository.js';

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
  _count: { devices: 3 },
};

function build() {
  const prisma = {
    shipment: {
      update: jest.fn().mockResolvedValue(shipmentRow),
      findUniqueOrThrow: jest.fn().mockResolvedValue(shipmentRow),
    },
    device: {
      groupBy: jest
        .fn()
        // first call = sums, second = devices with no customs fee
        .mockResolvedValueOnce([
          {
            shipmentId: 'ship-1',
            _sum: { unitExpense: 70, customsFee: 110 },
          },
        ])
        .mockResolvedValueOnce([{ shipmentId: 'ship-1', _count: { _all: 1 } }]),
    },
  } as unknown as PrismaService;
  return { repo: new ShipmentsRepository(prisma), prisma };
}

describe('ShipmentsRepository.update', () => {
  it('edits fields and returns computed totals (no money of its own)', async () => {
    const { repo } = build();
    const view = await repo.update('ship-1', { notes: 'x' });
    expect(view.unitExpenseTotal).toBe('70.00');
    expect(view.customsFeeTotal).toBe('110.00');
    expect(view.devicesWithoutCustomsFee).toBe(1);
  });
});
