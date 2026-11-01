import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import {
  RegisterDeviceDto,
  RegisterDevicesDto,
} from './dto/register-devices.dto.js';
import { UpdateShipmentDto } from './dto/update-shipment.dto.js';
import { ShipmentsRepository } from './shipments.repository.js';
import { RegisteredDeviceView, ShipmentView } from './types/shipment.types.js';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly repo: ShipmentsRepository,
    private readonly suppliers: SuppliersService,
    private readonly models: DeviceModelsService,
  ) {}

  list(): Promise<ShipmentView[]> {
    return this.repo.findAll();
  }

  get(id: string): Promise<ShipmentView> {
    return this.require(id);
  }

  async create(dto: CreateShipmentDto, userId: string): Promise<ShipmentView> {
    await this.suppliers.get(dto.supplierId);
    return this.repo.create({
      supplierId: dto.supplierId,
      shipmentDate: new Date(dto.shipmentDate),
      expectedCount: dto.expectedCount,
      overheadCost: dto.overheadCost,
      notes: dto.notes,
      createdById: userId,
    });
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<ShipmentView> {
    await this.require(id);
    return this.repo.update(id, {
      shipmentDate: dto.shipmentDate ? new Date(dto.shipmentDate) : undefined,
      expectedCount: dto.expectedCount,
      overheadCost: dto.overheadCost,
      notes: dto.notes,
    });
  }

  async addDevices(
    id: string,
    dto: RegisterDevicesDto,
    userId: string,
  ): Promise<RegisteredDeviceView[]> {
    await this.require(id);
    await this.assertModelsExist(dto.devices);
    try {
      return await this.repo.addDevices(id, dto.devices, userId);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A device with this IMEI already exists');
      }
      throw error;
    }
  }

  private async assertModelsExist(devices: RegisterDeviceDto[]): Promise<void> {
    const ids = [...new Set(devices.map((d) => d.modelId))];
    await Promise.all(ids.map((id) => this.models.get(id)));
  }

  private async require(id: string): Promise<ShipmentView> {
    const shipment = await this.repo.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }
}
