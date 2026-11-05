import { BadRequestException, ConflictException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { ListInspectionsDto } from './dto/list-inspections.dto.js';
import { QcLookupsRepository } from './qc-lookups.repository.js';
import { buildWhere, QcRepository } from './qc.repository.js';
import { QcService } from './qc.service.js';

function build(statusCode: string, storeIds = ['store-1']) {
  const repo = {
    createInspection: jest.fn().mockResolvedValue({ id: 'i1' }),
    list: jest.fn(),
  };
  const lookups = {
    listGrades: jest.fn().mockResolvedValue([{ code: 'A' }]),
    listDefectTypes: jest.fn().mockResolvedValue([{ code: 'CAMERA' }]),
  };
  const devices = {
    get: jest.fn().mockResolvedValue({ id: 'd1', statusCode }),
    changeStatus: jest.fn().mockResolvedValue({ id: 'd1' }),
  };
  const stores = {
    currentStoreIds: jest.fn().mockResolvedValue(storeIds),
  };
  const service = new QcService(
    repo as unknown as QcRepository,
    lookups as unknown as QcLookupsRepository,
    devices as unknown as DevicesService,
    stores as unknown as StoresService,
  );
  return { service, repo, devices, stores };
}

const CAMERA = [{ defectCode: 'CAMERA' }];

function dto(over: Partial<CreateInspectionDto>): CreateInspectionDto {
  return { deviceId: 'd1', passed: true, defects: [], ...over };
}

describe('QcService.createInspection', () => {
  it('moves an IN_STOCK device to DEFECTIVE on a failed inspection', async () => {
    const { service, devices } = build('IN_STOCK');
    await service.createInspection(
      dto({ passed: false, defects: CAMERA }),
      'u1',
    );
    expect(devices.changeStatus).toHaveBeenCalledWith(
      'd1',
      'DEFECTIVE',
      'u1',
      'QC',
    );
  });

  it('restores a DEFECTIVE device to IN_STOCK on a passed inspection', async () => {
    const { service, devices } = build('DEFECTIVE');
    await service.createInspection(dto({ passed: true }), 'u1');
    expect(devices.changeStatus).toHaveBeenCalledWith(
      'd1',
      'IN_STOCK',
      'u1',
      'QC',
    );
  });

  it('does not change status when a passed device is already IN_STOCK', async () => {
    const { service, devices } = build('IN_STOCK');
    await service.createInspection(dto({ passed: true }), 'u1');
    expect(devices.changeStatus).not.toHaveBeenCalled();
  });

  it('rejects an unknown defect code', async () => {
    const { service, repo } = build('IN_STOCK');
    await expect(
      service.createInspection(
        dto({ passed: false, defects: [{ defectCode: 'NOPE' }] }),
        'u1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(repo.createInspection).not.toHaveBeenCalled();
  });

  it('rejects a failed inspection with no defects', async () => {
    const { service, repo } = build('IN_STOCK');
    await expect(
      service.createInspection(dto({ passed: false, defects: [] }), 'u1'),
    ).rejects.toThrow(BadRequestException);
    expect(repo.createInspection).not.toHaveBeenCalled();
  });

  it('rejects a battery health outside 0-100', async () => {
    const { service, repo } = build('IN_STOCK');
    await expect(
      service.createInspection(dto({ batteryHealth: 150 }), 'u1'),
    ).rejects.toThrow(BadRequestException);
    expect(repo.createInspection).not.toHaveBeenCalled();
  });

  it('rejects inspecting a device that is not in stock or defective', async () => {
    const { service, repo } = build('SOLD');
    await expect(
      service.createInspection(dto({ passed: true }), 'u1'),
    ).rejects.toThrow(ConflictException);
    expect(repo.createInspection).not.toHaveBeenCalled();
  });
});

describe('QcService.list and buildWhere store scoping (R3)', () => {
  it('passes active storeIds to repo.list', async () => {
    const { service, repo } = build('IN_STOCK', ['store-active']);
    repo.list.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
    const query: ListInspectionsDto = { page: 1, pageSize: 20 };
    await service.list(query);
    expect(repo.list).toHaveBeenCalledWith(
      expect.objectContaining({ storeIds: ['store-active'] }),
      1,
      20,
    );
  });

  it('buildWhere filters by device storeId when storeIds is provided', () => {
    const whereSingle = buildWhere({ storeIds: ['store-1'] });
    expect(whereSingle.device).toEqual({ storeId: 'store-1' });

    const whereMulti = buildWhere({ storeIds: ['store-1', 'store-2'] });
    expect(whereMulti.device).toEqual({
      storeId: { in: ['store-1', 'store-2'] },
    });

    const whereWithImei = buildWhere({
      imei: '123456789012345',
      storeIds: ['store-1'],
    });
    expect(whereWithImei.device).toEqual({
      AND: [expect.any(Object), { storeId: 'store-1' }],
    });
  });
});
