import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { validateSpecs } from '../device-models/lib/attribute-schema.js';
import { DevicesExpenseRepository } from './devices-expense.repository.js';
import { DevicesQueryRepository } from './devices-query.repository.js';
import { DevicesStatusRepository } from './devices-status.repository.js';
import { ListDevicesDto } from './dto/list-devices.dto.js';
import { SetDeviceExpenseDto } from './dto/set-device-expense.dto.js';
import { UpdateDeviceDto } from './dto/update-device.dto.js';
import {
  DeviceDetailView,
  DeviceStatusHistoryView,
  DeviceView,
  PaginatedDevices,
} from './types/device.types.js';
import { OptimisticLockError } from './types/optimistic-lock.error.js';
import { isAllowedTransition } from './types/status-transitions.js';

@Injectable()
export class DevicesService {
  constructor(
    private readonly query: DevicesQueryRepository,
    private readonly status: DevicesStatusRepository,
    private readonly expense: DevicesExpenseRepository,
    private readonly models: DeviceModelsService,
  ) {}

  list(dto: ListDevicesDto): Promise<PaginatedDevices> {
    const { page, pageSize, ...filters } = dto;
    return this.query.list(filters, page, pageSize);
  }

  get(id: string): Promise<DeviceView> {
    return this.require(id);
  }

  /** In-stock/defective devices with no QC inspection yet (for the QC queue stats). */
  countAwaitingInspection(): Promise<number> {
    return this.query.countAwaitingInspection();
  }

  async getByImei(imei: string): Promise<DeviceDetailView> {
    const device = await this.query.findDetailByImei(imei);
    if (!device) {
      throw new NotFoundException(`Device with IMEI ${imei} not found`);
    }
    return device;
  }

  async getHistory(id: string): Promise<DeviceStatusHistoryView[]> {
    await this.require(id);
    return this.query.findHistory(id);
  }

  async updateDetails(id: string, dto: UpdateDeviceDto): Promise<DeviceView> {
    const device = await this.require(id);
    if (dto.specs !== undefined) {
      const attributes = await this.models.getAttributes(device.modelId);
      const problems = validateSpecs(attributes, dto.specs);
      if (problems.length > 0) {
        throw new BadRequestException({ message: 'Invalid specs', problems });
      }
    }
    if (dto.imei2) {
      if (dto.imei2 === device.imei) {
        throw new BadRequestException('imei2 must differ from imei');
      }
      if (await this.query.imeiInUse(dto.imei2, id)) {
        throw new ConflictException(`IMEI ${dto.imei2} already in use`);
      }
    }
    return this.status.updateDetails(id, dto);
  }

  /**
   * Sets a phone's own expense, recomputes its landed cost and posts the
   * DEVICE_EXPENSE difference (ADR 0026). A sold phone keeps its sale snapshot.
   */
  async setExpense(
    id: string,
    dto: SetDeviceExpenseDto,
    userId: string,
  ): Promise<DeviceView> {
    await this.require(id);
    return this.expense.setExpense(
      id,
      dto.unitExpense,
      dto.unitExpenseNote,
      userId,
    );
  }

  /**
   * Public API consumed by later waves (sales, consignment). Validates the
   * transition against the data-driven table, then applies it under the
   * version guard. Omit `expectedVersion` for server-driven changes (the
   * freshly-read version is used as the guard).
   */
  async changeStatus(
    deviceId: string,
    toStatusCode: string,
    userId: string,
    reason?: string,
    expectedVersion?: number,
  ): Promise<DeviceView> {
    const state = await this.status.findState(deviceId);
    if (!state) throw new NotFoundException(`Device ${deviceId} not found`);
    if (!isAllowedTransition(state.statusCode, toStatusCode)) {
      throw new BadRequestException(
        `Illegal transition ${state.statusCode} -> ${toStatusCode}`,
      );
    }
    try {
      return await this.status.applyStatusChange({
        deviceId,
        fromStatusCode: state.statusCode,
        toStatusCode,
        changedById: userId,
        reason,
        expectedVersion: expectedVersion ?? state.version,
      });
    } catch (error) {
      if (error instanceof OptimisticLockError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  private async require(id: string): Promise<DeviceView> {
    const device = await this.query.findById(id);
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }
}
