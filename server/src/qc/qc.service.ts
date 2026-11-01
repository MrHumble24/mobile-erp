import { BadRequestException, Injectable } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { QcRepository } from './qc.repository.js';
import { LookupView, QcInspectionView } from './types/qc.types.js';

@Injectable()
export class QcService {
  constructor(
    private readonly repo: QcRepository,
    private readonly devices: DevicesService,
  ) {}

  async createInspection(
    dto: CreateInspectionDto,
    userId: string,
  ): Promise<QcInspectionView> {
    const device = await this.devices.get(dto.deviceId);
    await this.assertCodes(dto);
    const inspection = await this.repo.createInspection({
      ...dto,
      inspectedById: userId,
    });
    await this.applyStatusEffect(dto, device.statusCode, userId);
    return inspection;
  }

  list(deviceId?: string): Promise<QcInspectionView[]> {
    return this.repo.findByDevice(deviceId);
  }

  listDefectTypes(): Promise<LookupView[]> {
    return this.repo.listDefectTypes();
  }

  listGrades(): Promise<LookupView[]> {
    return this.repo.listGrades();
  }

  /** QC pass/fail drives the device between IN_STOCK and DEFECTIVE. */
  private async applyStatusEffect(
    dto: CreateInspectionDto,
    statusCode: string,
    userId: string,
  ): Promise<void> {
    if (!dto.passed && statusCode === 'IN_STOCK') {
      await this.devices.changeStatus(dto.deviceId, 'DEFECTIVE', userId, 'QC');
    } else if (dto.passed && statusCode === 'DEFECTIVE') {
      await this.devices.changeStatus(dto.deviceId, 'IN_STOCK', userId, 'QC');
    }
  }

  private async assertCodes(dto: CreateInspectionDto): Promise<void> {
    const [grades, defectTypes] = await Promise.all([
      this.repo.listGrades(),
      this.repo.listDefectTypes(),
    ]);
    if (dto.gradeCode && !grades.some((g) => g.code === dto.gradeCode)) {
      throw new BadRequestException(`Unknown grade: ${dto.gradeCode}`);
    }
    const known = new Set(defectTypes.map((d) => d.code));
    const unknown = dto.defects
      .map((d) => d.defectCode)
      .filter((code) => !known.has(code));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown defect types: ${unknown.join(', ')}`,
      );
    }
  }
}
