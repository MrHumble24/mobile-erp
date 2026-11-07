import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import type { ImportShipmentDto } from './dto/import-shipment.dto.js';

function build(customsFees: Map<string, number> = new Map()) {
  const repo = {
    findById: jest.fn().mockResolvedValue({
      id: 'ship-new',
      supplierId: 'sup-1',
      exchangeRate: '1.3000',
    }),
  } as unknown as ShipmentsRepository;
  const intakeRepo = {
    findExistingImeis: jest.fn().mockResolvedValue([]),
    createShipmentWithDevices: jest.fn().mockResolvedValue({
      shipment: { id: 'ship-new', supplierId: 'sup-1', exchangeRate: '1.3000' },
      devices: [{ id: 'd-1', imei: '111111111111111' }],
    }),
  } as unknown as ShipmentsIntakeRepository;
  const quantityRepo = {} as unknown as ShipmentsQuantityRepository;
  const suppliers = {
    get: jest.fn().mockResolvedValue({ name: 'Supplier One' }),
  } as unknown as SuppliersService;
  const models = {
    list: jest.fn().mockResolvedValue([
      {
        id: 'm1',
        brand: 'Apple',
        name: 'iPhone 15 Pro',
        kindCode: 'IMEI',
        customsCode: 'iPhone 15 Pro',
        attributes: [
          {
            key: 'storage',
            label: 'Storage',
            type: 'select',
            options: ['256GB'],
            required: true,
            sortOrder: 10,
          },
        ],
      },
    ]),
  } as unknown as DeviceModelsService;
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
    currentStoreIds: jest.fn().mockResolvedValue(['store-1']),
  } as unknown as StoresService;
  const ledger = {} as unknown as LedgerService;
  const stock = {
    purchaseTotalsByShipment: jest.fn().mockResolvedValue(new Map()),
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
  return { service, intakeRepo, suppliers, models, customs };
}

const user = (perms: string[]): AuthenticatedUser => ({
  id: 'user-1',
  email: 'u@x',
  permissions: new Set(perms),
});

const baseDto: ImportShipmentDto = {
  storeId: 'store-1',
  supplierId: 'sup-1',
  shipmentDate: '2026-11-07',
  paymentAccountCode: 'CASH_USD',
  exchangeRate: 1.3,
  rows: [
    {
      row: 3,
      modelName: 'iPhone 15 Pro 256GB',
      imei: '111111111111111',
      price: 550,
      expense: 70,
      markup: 50,
      batteryHealth: 92,
      defects: 'screen scratches',
    },
  ],
};

describe('ShipmentsService.importShipment', () => {
  it('rejects import if expense > 0 without device.expense permission', async () => {
    const { service } = build();
    await expect(
      service.importShipment(baseDto, user(['device.create'])),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects with 400 and problem list if validation fails', async () => {
    const { service, intakeRepo } = build();
    (intakeRepo.findExistingImeis as jest.Mock).mockResolvedValue([
      '111111111111111',
    ]);
    try {
      await service.importShipment(
        baseDto,
        user(['device.create', 'device.expense']),
      );
      fail('Expected BadRequestException');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestException);
      const res = (err as BadRequestException).getResponse() as {
        message: string;
        problems: unknown[];
      };
      expect(res.problems).toHaveLength(1);
      expect(res.problems[0]).toMatchObject({
        row: 3,
        code: 'IMEI_ALREADY_EXISTS',
      });
    }
  });

  it('successfully creates shipment with exchangeRate and registers devices', async () => {
    const { service, intakeRepo } = build(
      new Map([['IPHONE 15 PRO 256GB', 65]]),
    );
    const result = await service.importShipment(
      baseDto,
      user(['device.create', 'device.expense']),
    );

    expect(intakeRepo.createShipmentWithDevices).toHaveBeenCalledTimes(1);
    const [shipmentInput, deviceInputs] = (
      intakeRepo.createShipmentWithDevices as jest.Mock
    ).mock.calls[0];

    expect(shipmentInput).toMatchObject({
      exchangeRate: 1.3,
      expectedCount: 1,
      paymentAccountCode: 'CASH_USD',
    });

    expect(deviceInputs[0]).toMatchObject({
      imei: '111111111111111',
      acquisitionCost: 423.08,
      acquisitionCostOriginal: 550,
      customsFee: 65,
      unitExpense: 5,
      targetPrice: 473.08,
      specs: {
        storage: '256GB',
        batteryHealth: 92,
        defects: 'screen scratches',
      },
    });

    expect(result.id).toBe('ship-new');
    expect(result.warnings).toHaveLength(0);
  });

  it('includes warning when fee is higher than expense', async () => {
    const { service } = build(new Map([['IPHONE 15 PRO 256GB', 80]]));
    const result = await service.importShipment(
      baseDto,
      user(['device.create', 'device.expense']),
    );

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatchObject({
      row: 3,
      code: 'EXPENSE_LESS_THAN_FEE',
    });
  });
});
