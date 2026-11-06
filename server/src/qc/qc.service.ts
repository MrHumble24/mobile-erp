import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CreateInspectionDto } from './dto/create-inspection.dto.js';
import { ListInspectionsDto } from './dto/list-inspections.dto.js';
import { QcLookupsRepository } from './qc-lookups.repository.js';
import { QcRepository } from './qc.repository.js';
import {
  InspectionFilters,
  PaginatedInspections,
  QcInspectionView,
} from './types/qc.types.js';

const INSPECTABLE = new Set(['IN_STOCK', 'DEFECTIVE']);

@Injectable()
export class QcService {
  constructor(
    private readonly repo: QcRepository,
    private readonly lookups: QcLookupsRepository,
    private readonly devices: DevicesService,
    private readonly stores: StoresService,
  ) {}

  async createInspection(
    dto: CreateInspectionDto,
    userId: string,
  ): Promise<QcInspectionView> {
    const device = await this.devices.get(dto.deviceId);
    this.assertInspectable(device.statusCode);
    this.assertFailHasDefects(dto);
    this.assertBattery(dto);
    await this.assertCodes(dto);
    const inspection = await this.repo.createInspection({
      ...dto,
      inspectedById: userId,
    });
    await this.applyStatusEffect(dto, device.statusCode, userId);
    return inspection;
  }

  async list(dto: ListInspectionsDto): Promise<PaginatedInspections> {
    const { page, pageSize } = dto;
    const storeIds = await this.stores.currentStoreIds();
    return this.repo.list({ ...toFilters(dto), storeIds }, page, pageSize);
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

  private assertInspectable(statusCode: string): void {
    if (!INSPECTABLE.has(statusCode)) {
      throw new ConflictException(
        `Device in status ${statusCode} cannot be inspected`,
      );
    }
  }

  private assertFailHasDefects(dto: CreateInspectionDto): void {
    if (!dto.passed && dto.defects.length === 0) {
      throw new BadRequestException(
        'A failed inspection requires at least one defect',
      );
    }
  }

  private assertBattery(dto: CreateInspectionDto): void {
    const bh = dto.batteryHealth;
    if (bh !== undefined && (bh < 0 || bh > 100)) {
      throw new BadRequestException('batteryHealth must be between 0 and 100');
    }
  }

  private async assertCodes(dto: CreateInspectionDto): Promise<void> {
    const [grades, defectTypes] = await Promise.all([
      this.lookups.listGrades(false),
      this.lookups.listDefectTypes(false),
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

function toFilters(dto: ListInspectionsDto): InspectionFilters {
  return {
    deviceId: dto.deviceId,
    imei: dto.imei,
    passed: dto.passed === undefined ? undefined : dto.passed === 'true',
    gradeCode: dto.gradeCode,
    defectCode: dto.defectCode,
    inspectedById: dto.inspectedById,
    from: dto.from ? new Date(dto.from) : undefined,
    to: dto.to ? new Date(dto.to) : undefined,
  };
}
