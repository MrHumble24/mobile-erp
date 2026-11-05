import { ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { ShipmentsRepository } from './shipments.repository.js';
import { ShipmentsService } from './shipments.service.js';

function build() {
  const repo = {
    findById: jest
      .fn()
      .mockResolvedValue({ id: 'ship-1', supplierId: 'sup-1' }),
    addDevices: jest.fn().mockResolvedValue([]),
  } as unknown as ShipmentsRepository;
  const suppliers = {
    get: jest.fn().mockResolvedValue({ name: 'S' }),
  } as unknown as SuppliersService;
  const models = {
    get: jest
      .fn()
      .mockResolvedValue({ id: 'm1', brand: 'A', name: 'X', attributes: [] }),
  } as unknown as DeviceModelsService;
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
  } as unknown as StoresService;
  const ledger = {} as unknown as LedgerService;
  const events = { emit: jest.fn() } as unknown as EventEmitter2;
  const service = new ShipmentsService(
    repo,
    suppliers,
    models,
    stores,
    ledger,
    events,
  );
  return { service, repo };
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
    const { service, repo } = build();
    await expect(
      service.addDevices('ship-1', intake(40), user(['device.create'])),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.addDevices).not.toHaveBeenCalled();
  });

  it('allows a non-zero unitExpense with device.expense', async () => {
    const { service, repo } = build();
    await service.addDevices(
      'ship-1',
      intake(40),
      user(['device.create', 'device.expense']),
    );
    expect(repo.addDevices).toHaveBeenCalled();
  });

  it('allows intake with no unitExpense without the permission', async () => {
    const { service, repo } = build();
    await service.addDevices('ship-1', intake(), user(['device.create']));
    expect(repo.addDevices).toHaveBeenCalled();
  });
});
