import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomsService } from '../customs/customs.service.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { ShipmentsIntakeRepository } from './shipments-intake.repository.js';
import { ShipmentsRepository } from './shipments.repository.js';
import { ShipmentsService } from './shipments.service.js';

function build(customsFees: Map<string, number> = new Map()) {
  const repo = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: 'ship-1', supplierId: 'sup-1' }),
  } as unknown as ShipmentsRepository;
  const intakeRepo = {
    addDevices: jest.fn().mockResolvedValue([]),
  } as unknown as ShipmentsIntakeRepository;
  const suppliers = {
    get: jest.fn().mockResolvedValue({ name: 'S' }),
  } as unknown as SuppliersService;
  const models = {
    get: jest.fn().mockResolvedValue({
      id: 'm1',
      brand: 'A',
      name: 'X',
      customsCode: 'C1',
      attributes: [],
    }),
  } as unknown as DeviceModelsService;
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
  } as unknown as StoresService;
  const ledger = {} as unknown as LedgerService;
  const customs = {
    currentFeeMap: jest.fn().mockResolvedValue(customsFees),
  } as unknown as CustomsService;
  const events = { emit: jest.fn() } as unknown as EventEmitter2;
  const service = new ShipmentsService(
    repo,
    intakeRepo,
    suppliers,
    models,
    stores,
    ledger,
    customs,
    events,
  );
  return { service, intakeRepo };
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
