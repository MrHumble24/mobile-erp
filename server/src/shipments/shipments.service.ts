import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomsService } from '../customs/customs.service.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { validateSpecs } from '../device-models/lib/attribute-schema.js';
import type { DeviceModelView } from '../device-models/types/device-model.types.js';
import { LedgerService } from '../ledger/ledger.service.js';
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
import { ShipmentsIntakeRepository } from './shipments-intake.repository.js';
import { ShipmentsRepository } from './shipments.repository.js';
import {
  RegisteredDeviceView,
  RegisterDeviceInput,
  ShipmentView,
} from './types/shipment.types.js';

@Injectable()
export class ShipmentsService {
  constructor(
    private readonly repo: ShipmentsRepository,
    private readonly intake: ShipmentsIntakeRepository,
    private readonly suppliers: SuppliersService,
    private readonly models: DeviceModelsService,
    private readonly stores: StoresService,
    private readonly ledger: LedgerService,
    private readonly customs: CustomsService,
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
    const paymentAccountCode = dto.paymentAccountCode ?? 'CASH';
    if (
      !(await this.ledger.activeAccountCodes()).includes(paymentAccountCode)
    ) {
      throw new BadRequestException(
        `Unknown or inactive account ${paymentAccountCode}`,
      );
    }
    return this.repo.create({
      storeId: await this.stores.currentStoreId(),
      supplierId: dto.supplierId,
      shipmentDate: new Date(dto.shipmentDate),
      expectedCount: dto.expectedCount,
      paymentAccountCode,
      notes: dto.notes,
      createdById: userId,
    });
  }

  async update(id: string, dto: UpdateShipmentDto): Promise<ShipmentView> {
    await this.require(id);
    return this.repo.update(id, {
      shipmentDate: dto.shipmentDate ? new Date(dto.shipmentDate) : undefined,
      expectedCount: dto.expectedCount,
      notes: dto.notes,
    });
  }

  async addDevices(
    id: string,
    dto: RegisterDevicesDto,
    user: AuthenticatedUser,
  ): Promise<RegisteredDeviceView[]> {
    const shipment = await this.require(id);
    const models = await this.loadModels(dto.devices);
    this.assertSpecs(dto.devices, models);
    this.assertExpensePermission(dto.devices, user);
    const inputs = await this.stampCustomsFees(dto.devices, models);
    const registered = await this.register(id, inputs, user.id);
    // Best-effort notification; must never fail an intake.
    void this.announce(
      shipment.supplierId,
      id,
      registered.length,
      models,
    ).catch(() => undefined);
    return registered;
  }

  /** Stamp each device with the current list's fee for its model's customsCode. */
  private async stampCustomsFees(
    devices: RegisterDeviceDto[],
    models: DeviceModelView[],
  ): Promise<RegisterDeviceInput[]> {
    const codeByModel = new Map(models.map((m) => [m.id, m.customsCode]));
    const feeByCode = await this.customs.currentFeeMap();
    return devices.map((d) => {
      const code = codeByModel.get(d.modelId) ?? null;
      const customsFee = code ? (feeByCode.get(code) ?? 0) : 0;
      return { ...d, customsFee };
    });
  }

  private async register(
    id: string,
    inputs: RegisterDeviceInput[],
    userId: string,
  ): Promise<RegisteredDeviceView[]> {
    try {
      const storeId = await this.stores.currentStoreId();
      return await this.intake.addDevices(id, inputs, userId, storeId);
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

  /** A non-zero unitExpense at intake needs the `device.expense` permission. */
  private assertExpensePermission(
    devices: RegisterDeviceDto[],
    user: AuthenticatedUser,
  ): void {
    const wantsExpense = devices.some((d) => (d.unitExpense ?? 0) !== 0);
    if (wantsExpense && !user.permissions.has('device.expense')) {
      throw new ForbiddenException(
        'device.expense permission required to set a unit expense',
      );
    }
  }

  private async require(id: string): Promise<ShipmentView> {
    const shipment = await this.repo.findById(id);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    return shipment;
  }
}
