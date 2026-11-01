import { BadRequestException } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { QcRepository } from './qc.repository.js';
import { QcService } from './qc.service.js';

function build(statusCode: string) {
  const repo = {
    createInspection: jest.fn().mockResolvedValue({ id: 'i1' }),
    findByDevice: jest.fn(),
    listGrades: jest.fn().mockResolvedValue([{ code: 'A' }]),
    listDefectTypes: jest.fn().mockResolvedValue([{ code: 'CAMERA' }]),
  };
  const devices = {
    get: jest.fn().mockResolvedValue({ id: 'd1', statusCode }),
    changeStatus: jest.fn().mockResolvedValue({ id: 'd1' }),
  };
  const service = new QcService(
    repo as unknown as QcRepository,
    devices as unknown as DevicesService,
  );
  return { service, repo, devices };
}

function dto(over: Partial<CreateInspectionDto>): CreateInspectionDto {
  return { deviceId: 'd1', passed: true, defects: [], ...over };
}

describe('QcService.createInspection', () => {
  it('moves an IN_STOCK device to DEFECTIVE on a failed inspection', async () => {
    const { service, devices } = build('IN_STOCK');
    await service.createInspection(dto({ passed: false }), 'u1');
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
});
