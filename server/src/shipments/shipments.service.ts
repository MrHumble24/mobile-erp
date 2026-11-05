import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { validateSpecs } from '../device-models/lib/attribute-schema.js';
import type { DeviceModelView } from '../device-models/types/device-model.types.js';
import { StoresService } from '../stores/stores.service.js';
import { SuppliersService } from '../suppliers/suppliers.service.js';
import {
  ShipmentDevicesRegisteredEvent,
  TelegramEvents,
} from '../telegram/events/telegram-events.js';
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
    private readonly stores: StoresService,
    private readonly events: EventEmitter2,
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
      storeId: await this.stores.currentStoreId(),
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
    const shipment = await this.require(id);
    const models = await this.loadModels(dto.devices);
    this.assertSpecs(dto.devices, models);
    const registered = await this.register(id, dto.devices, userId);
    // Best-effort notification; must never fail an intake.
    void this.announce(
      shipment.supplierId,
      id,
      registered.length,
      models,
    ).catch(() => undefined);
    return registered;
  }

  private async register(
    id: string,
    devices: RegisterDeviceDto[],
    userId: string,
  ): Promise<RegisteredDeviceView[]> {
    try {
      const storeId = await this.stores.currentStoreId();
      return await this.repo.addDevices(id, devices, userId, storeId);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A device with this IMEI already exists');
      }
      throw error;
    }
  }

  private async announce(
    supplierId: string,
    shipmentId: string,
    count: number,
    models: { brand: string; name: string }[],
  ): Promise<void> {
    const supplier = await this.suppliers.get(supplierId);
    const names = [...new Set(models.map((m) => `${m.brand} ${m.name}`))];
    this.events.emit(
      TelegramEvents.shipmentDevicesRegistered,
      new ShipmentDevicesRegisteredEvent(
        shipmentId,
        supplier.name,
        count,
        names,
      ),
    );
  }

  private loadModels(devices: RegisterDeviceDto[]): Promise<DeviceModelView[]> {
    const ids = [...new Set(devices.map((d) => d.modelId))];
    return Promise.all(ids.map((id) => this.models.get(id)));
  }

  /** Strict per-unit spec validation against each model's attribute schema. */
  private assertSpecs(
    devices: RegisterDeviceDto[],
    models: DeviceModelView[],
  ): void {
    const attrsById = new Map(models.map((m) => [m.id, m.attributes]));
    const problems = devices.flatMap((d) =>
      validateSpecs(attrsById.get(d.modelId) ?? [], d.specs).map((p) => ({
        imei: d.imei,
        ...p,
      })),
    );
    if (problems.length > 0) {
      throw new BadRequestException({ message: 'Invalid specs', problems });
    }
  }

  private async require(id: string): Promise<ShipmentView> {
    const shipment = await this.repo.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }
}
