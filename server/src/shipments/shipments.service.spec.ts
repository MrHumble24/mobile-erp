import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomsService } from '../customs/customs.service.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { ShipmentsIntakeRepository } from './shipments-intake.repository.js';
import { ShipmentsQuantityRepository } from './shipments-quantity.repository.js';
import { ShipmentsRepository } from './shipments.repository.js';
import { ShipmentsService } from './shipments.service.js';

function build(
  customsFees: Map<string, number> = new Map(),
  kindCode = 'IMEI',
) {
  const repo = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: 'ship-1', supplierId: 'sup-1' }),
  } as unknown as ShipmentsRepository;
  const intakeRepo = {
    addDevices: jest.fn().mockResolvedValue([]),
  } as unknown as ShipmentsIntakeRepository;
  const quantityRepo = {
    purchase: jest.fn().mockResolvedValue([]),
  } as unknown as ShipmentsQuantityRepository;
  const suppliers = {
    get: jest.fn().mockResolvedValue({ name: 'S' }),
  } as unknown as SuppliersService;
  const models = {
    get: jest.fn().mockResolvedValue({
      id: 'm1',
      brand: 'A',
      name: 'X',
      kindCode,
      customsCode: 'C1',
      attributes: [],
    }),
  } as unknown as DeviceModelsService;
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
    currentStoreIds: jest.fn().mockResolvedValue(['store-1']),
  } as unknown as StoresService;
  const ledger = {} as unknown as LedgerService;
  const stock = {
    assertQuantityModel: jest.fn().mockResolvedValue(undefined),
    purchaseTotalsByShipment: jest.fn().mockResolvedValue(new Map()),
    shipmentPurchaseLines: jest.fn().mockResolvedValue([]),
  } as unknown as StockService;
  const customs = {
    currentFeeMap: jest.fn().mockResolvedValue(customsFees),
  } as unknown as CustomsService;
  const events = { emit: jest.fn() } as unknown as EventEmitter2;
  const service = new ShipmentsService(
    repo,
    intakeRepo,
    quantityRepo,
    suppliers,
    models,
    stores,
    ledger,
    stock,
    customs,
    events,
  );
  return { service, intakeRepo, quantityRepo, stock };
}

const user = (perms: string[]): AuthenticatedUser => ({
  id: 'user-1',
  email: 'u@x',
  permissions: new Set(perms),
});

const intake = (unitExpense?: number) => ({
  devices: [
    {
      imei: '111111111111111',
      modelId: 'm1',
      specs: {},
      acquisitionCost: 300,
      unitExpense,
    },
  ],
});

describe('ShipmentsService.addDevices unit-expense permission', () => {
  it('rejects a non-zero unitExpense without device.expense (403)', async () => {
    const { service, intakeRepo } = build();
    await expect(
      service.addDevices('ship-1', intake(40), user(['device.create'])),
    ).rejects.toThrow(ForbiddenException);
    expect(intakeRepo.addDevices).not.toHaveBeenCalled();
  });

  it('allows a non-zero unitExpense with device.expense', async () => {
    const { service, intakeRepo } = build();
    await service.addDevices(
      'ship-1',
      intake(40),
      user(['device.create', 'device.expense']),
    );
    expect(intakeRepo.addDevices).toHaveBeenCalled();
  });

  it('allows intake with no unitExpense without the permission', async () => {
    const { service, intakeRepo } = build();
    await service.addDevices('ship-1', intake(), user(['device.create']));
    expect(intakeRepo.addDevices).toHaveBeenCalled();
  });
});

describe('ShipmentsService.addDevices kind rules (ADR 0029)', () => {
  const serialUnit = (over: Record<string, unknown> = {}) => ({
    devices: [{ modelId: 'm1', specs: {}, acquisitionCost: 300, ...over }],
  });

  it('rejects an IMEI unit with no imei', async () => {
    const { service } = build();
    await expect(
      service.addDevices('ship-1', serialUnit(), user(['device.create'])),
    ).rejects.toThrow('An IMEI product requires an imei');
  });

  it('rejects an IMEI unit that carries a serialNumber', async () => {
    const { service } = build();
    await expect(
      service.addDevices(
        'ship-1',
        serialUnit({ imei: '111111111111111', serialNumber: 'SN-1' }),
        user(['device.create']),
      ),
    ).rejects.toThrow('must not carry a serialNumber');
  });

  it('rejects a serial unit with an imei', async () => {
    const { service } = build(new Map(), 'SERIAL');
    await expect(
      service.addDevices(
        'ship-1',
        serialUnit({ imei: '111111111111111', serialNumber: 'SN-1' }),
        user(['device.create']),
      ),
    ).rejects.toThrow('must not carry an IMEI');
  });

  it('rejects a serial unit with no serialNumber', async () => {
    const { service } = build(new Map(), 'SERIAL');
    await expect(
      service.addDevices('ship-1', serialUnit(), user(['device.create'])),
    ).rejects.toThrow('requires a serialNumber');
  });

  it('accepts a serial unit and normalises its serial', async () => {
    const { service, intakeRepo } = build(new Map(), 'SERIAL');
    await service.addDevices(
      'ship-1',
      serialUnit({ serialNumber: ' sn-1 ' }),
      user(['device.create']),
    );
    const [, inputs] = (intakeRepo.addDevices as jest.Mock).mock.calls[0];
    expect(inputs[0].serialNumber).toBe('SN-1');
    expect(inputs[0].kindCode).toBe('SERIAL');
  });

  it('rejects a QUANTITY model at intake', async () => {
    const { service } = build(new Map(), 'QUANTITY');
    await expect(
      service.addDevices(
        'ship-1',
        serialUnit({ imei: '111111111111111' }),
        user(['device.create']),
      ),
    ).rejects.toThrow('Quantity products are not stocked as units');
  });
});

describe('ShipmentsService.addDevices customs stamping', () => {
  it("stamps each device with the current list's fee for its model code", async () => {
    const { service, intakeRepo } = build(new Map([['C1', 55]]));
    await service.addDevices('ship-1', intake(), user(['device.create']));
    const [, inputs] = (intakeRepo.addDevices as jest.Mock).mock.calls[0];
    expect(inputs[0].customsFee).toBe(55);
  });

  it('stamps 0 when the model code is absent from the current list', async () => {
    const { service, intakeRepo } = build(new Map([['OTHER', 55]]));
    await service.addDevices('ship-1', intake(), user(['device.create']));
    const [, inputs] = (intakeRepo.addDevices as jest.Mock).mock.calls[0];
    expect(inputs[0].customsFee).toBe(0);
  });
});

describe('ShipmentsService.get stock lines (ADR 0030/0034)', () => {
  const line = {
    id: 'mv1',
    modelId: 'm1',
    brand: 'Generic',
    name: 'Cable',
    quantity: 10,
    unitCost: new Prisma.Decimal(10),
    lineTotal: new Prisma.Decimal(100),
    occurredAt: new Date(),
  };

  it('returns purchase lines and their total, with cost for a cost-viewer', async () => {
    const { service, stock } = build();
    (stock.shipmentPurchaseLines as jest.Mock).mockResolvedValue([line]);
    const out = await service.get(
      user(['shipment.read', 'device.cost.view']),
      'ship-1',
    );
    expect(stock.shipmentPurchaseLines).toHaveBeenCalledWith('ship-1');
    expect(out.stockLinesTotal).toBe('100.00');
    expect(out.stockLines[0]).toMatchObject({
      modelId: 'm1',
      quantity: 10,
      unitCost: '10.00',
      lineTotal: '100.00',
    });
  });

  it('hides unitCost/lineTotal without device.cost.view', async () => {
    const { service, stock } = build();
    (stock.shipmentPurchaseLines as jest.Mock).mockResolvedValue([line]);
    const out = await service.get(user(['shipment.read']), 'ship-1');
    expect(out.stockLines[0].unitCost).toBeNull();
    expect(out.stockLines[0].lineTotal).toBeNull();
  });
});
