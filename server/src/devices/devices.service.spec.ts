import { BadRequestException, ConflictException } from '@nestjs/common';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { DevicesExpenseRepository } from './devices-expense.repository.js';
import { DevicesQueryRepository } from './devices-query.repository.js';
import { DevicesStatusRepository } from './devices-status.repository.js';
import { DevicesService } from './devices.service.js';
import { OptimisticLockError } from './types/optimistic-lock.error.js';
import { isAllowedTransition } from './types/status-transitions.js';

function build(
  state: { statusCode: string; version: number } | null,
  queryOverrides: Partial<Record<string, jest.Mock>> = {},
) {
  const status = {
    findState: jest.fn().mockResolvedValue(state),
    applyStatusChange: jest.fn().mockResolvedValue({ id: 'd1' }),
    updateDetails: jest.fn().mockResolvedValue({ id: 'd1' }),
  };
  const query = {
    findById: jest.fn(),
    imeiInUse: jest.fn().mockResolvedValue(false),
    ...queryOverrides,
  } as unknown as DevicesQueryRepository;
  const expense = {
    setExpense: jest.fn().mockResolvedValue({ id: 'd1', unitExpense: '40.00' }),
  } as unknown as DevicesExpenseRepository;
  const models = {
    getAttributes: jest.fn().mockResolvedValue([]),
  } as unknown as DeviceModelsService;
  const service = new DevicesService(
    query,
    status as unknown as DevicesStatusRepository,
    expense,
    models,
  );
  return { service, status, query, expense };
}

describe('isAllowedTransition', () => {
  it('accepts every seeded transition and rejects same-status/unknown', () => {
    expect(isAllowedTransition('IN_STOCK', 'DEFECTIVE')).toBe(true);
    expect(isAllowedTransition('CONSIGNED', 'SOLD')).toBe(true);
    expect(isAllowedTransition('SOLD', 'IN_STOCK')).toBe(true);
    expect(isAllowedTransition('IN_STOCK', 'IN_STOCK')).toBe(false);
    expect(isAllowedTransition('DEFECTIVE', 'SOLD')).toBe(false);
    expect(isAllowedTransition('DEFECTIVE', 'CONSIGNED')).toBe(false);
  });
});

describe('DevicesService.changeStatus', () => {
  it('applies an allowed transition with the caller version', async () => {
    const { service, status } = build({ statusCode: 'IN_STOCK', version: 3 });
    await service.changeStatus('d1', 'DEFECTIVE', 'u1', 'QC', 3);
    expect(status.applyStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'd1',
        fromStatusCode: 'IN_STOCK',
        toStatusCode: 'DEFECTIVE',
        changedById: 'u1',
        expectedVersion: 3,
      }),
    );
  });

  it('falls back to the read version when expectedVersion is omitted', async () => {
    const { service, status } = build({ statusCode: 'DEFECTIVE', version: 7 });
    await service.changeStatus('d1', 'IN_STOCK', 'u1', 'QC');
    expect(status.applyStatusChange).toHaveBeenCalledWith(
      expect.objectContaining({ expectedVersion: 7 }),
    );
  });

  it('rejects an illegal transition before touching the repo', async () => {
    const { service, status } = build({ statusCode: 'DEFECTIVE', version: 1 });
    await expect(
      service.changeStatus('d1', 'SOLD', 'u1', undefined, 1),
    ).rejects.toThrow(BadRequestException);
    expect(status.applyStatusChange).not.toHaveBeenCalled();
  });

  it('maps a version mismatch to 409', async () => {
    const { service, status } = build({ statusCode: 'IN_STOCK', version: 1 });
    status.applyStatusChange.mockRejectedValueOnce(new OptimisticLockError());
    await expect(
      service.changeStatus('d1', 'SOLD', 'u1', undefined, 0),
    ).rejects.toThrow(ConflictException);
  });
});

describe('DevicesService.setExpense', () => {
  const device = { id: 'd1', imei: '111111111111111', modelId: 'm1' };

  it('delegates to the expense repo after confirming the device exists', async () => {
    const { service, expense } = build(null, {
      findById: jest.fn().mockResolvedValue(device),
    });
    await service.setExpense('d1', { unitExpense: 40 }, 'user-1');
    expect(expense.setExpense).toHaveBeenCalledWith(
      'd1',
      40,
      undefined,
      'user-1',
    );
  });

  it('404s when the device does not exist, without posting', async () => {
    const { service, expense } = build(null, {
      findById: jest.fn().mockResolvedValue(null),
    });
    await expect(
      service.setExpense('missing', { unitExpense: 40 }, 'user-1'),
    ).rejects.toThrow('not found');
    expect(expense.setExpense).not.toHaveBeenCalled();
  });
});

describe('DevicesService.updateDetails imei2', () => {
  const device = { id: 'd1', imei: '111111111111111', modelId: 'm1' };

  it('rejects imei2 equal to imei', async () => {
    const { service, status } = build(null, {
      findById: jest.fn().mockResolvedValue(device),
    });
    await expect(
      service.updateDetails('d1', { imei2: device.imei }),
    ).rejects.toThrow(BadRequestException);
    expect(status.updateDetails).not.toHaveBeenCalled();
  });

  it('rejects an imei2 already used by another device', async () => {
    const { service, status } = build(null, {
      findById: jest.fn().mockResolvedValue(device),
      imeiInUse: jest.fn().mockResolvedValue(true),
    });
    await expect(
      service.updateDetails('d1', { imei2: '222222222222222' }),
    ).rejects.toThrow(ConflictException);
    expect(status.updateDetails).not.toHaveBeenCalled();
  });

  it('persists a valid, free imei2 (checking both columns, excluding self)', async () => {
    const imeiInUse = jest.fn().mockResolvedValue(false);
    const { service, status } = build(null, {
      findById: jest.fn().mockResolvedValue(device),
      imeiInUse,
    });
    await service.updateDetails('d1', { imei2: '222222222222222' });
    expect(imeiInUse).toHaveBeenCalledWith('222222222222222', 'd1');
    expect(status.updateDetails).toHaveBeenCalledWith('d1', {
      imei2: '222222222222222',
    });
  });
});
