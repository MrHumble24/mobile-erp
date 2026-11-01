import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DevicesQueryRepository } from './devices-query.repository.js';
import { DevicesStatusRepository } from './devices-status.repository.js';
import { ListDevicesDto } from './dto/list-devices.dto.js';
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
  ) {}

  list(dto: ListDevicesDto): Promise<PaginatedDevices> {
    const { page, pageSize, ...filters } = dto;
    return this.query.list(filters, page, pageSize);
  }

  get(id: string): Promise<DeviceView> {
    return this.require(id);
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
    await this.require(id);
    return this.status.updateDetails(id, dto);
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
