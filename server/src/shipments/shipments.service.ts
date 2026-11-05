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
import { normalizeSerial } from '../devices/lib/unit-code.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StockService } from '../stock/stock.service.js';
import type { PurchasedLineView } from '../stock/types/stock.types.js';
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
import { RegisterItemsDto } from './dto/register-items.dto.js';
import { ShipmentsIntakeRepository } from './shipments-intake.repository.js';
import { ShipmentsQuantityRepository } from './shipments-quantity.repository.js';
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
    private readonly quantity: ShipmentsQuantityRepository,
    private readonly suppliers: SuppliersService,
    private readonly models: DeviceModelsService,
    private readonly stores: StoresService,
    private readonly ledger: LedgerService,
    private readonly stock: StockService,
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
    this.assertKindRules(dto.devices, models);
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

  /**
   * Buy quantity products into this shipment (ADR 0030). Each line must be a
   * QUANTITY model; each posts a PURCHASE stock movement and a PURCHASE ledger
   * row from the shipment's account, in one transaction. Same permission as
   * device intake (`device.create`).
   */
  async addItems(
    id: string,
    dto: RegisterItemsDto,
    user: AuthenticatedUser,
  ): Promise<PurchasedLineView[]> {
    await this.require(id);
    for (const item of dto.items) {
      await this.stock.assertQuantityModel(item.modelId);
    }
    return this.quantity.purchase(id, dto.items, user.id);
  }

  /** Stamp each device with the current list's fee for its model's customsCode. */
  private async stampCustomsFees(
    devices: RegisterDeviceDto[],
    models: DeviceModelView[],
  ): Promise<RegisterDeviceInput[]> {
    const byModel = new Map(models.map((m) => [m.id, m]));
    const feeByCode = await this.customs.currentFeeMap();
    return devices.map((d) => {
      const model = byModel.get(d.modelId)!;
      const code = model.customsCode;
      const customsFee = code ? (feeByCode.get(code) ?? 0) : 0;
      return {
        ...d,
        kindCode: model.kindCode,
        serialNumber: d.serialNumber
          ? normalizeSerial(d.serialNumber)
          : undefined,
        customsFee,
      };
    });
  }

  /**
   * Per-kind intake rules (kind comes from the model, ADR 0029):
   * QUANTITY is not stocked as a unit; an IMEI unit needs an `imei` and no
   * `serialNumber`; a SERIAL unit needs a `serialNumber` and no `imei`/`imei2`.
   */
  private assertKindRules(
    devices: RegisterDeviceDto[],
    models: DeviceModelView[],
  ): void {
    const kindById = new Map(models.map((m) => [m.id, m.kindCode]));
    for (const d of devices) {
      const kind = kindById.get(d.modelId);
      if (kind === 'QUANTITY') {
        throw new BadRequestException(
          'Quantity products are not stocked as units; use quantity stock',
        );
      }
      if (kind === 'SERIAL') {
        if (!d.serialNumber) {
          throw new BadRequestException(
            'A serial product requires a serialNumber',
          );
        }
        if (d.imei || d.imei2) {
          throw new BadRequestException(
            'A serial product must not carry an IMEI',
          );
        }
      } else {
        // IMEI kind (default).
        if (!d.imei) {
          throw new BadRequestException('An IMEI product requires an imei');
        }
        if (d.serialNumber) {
          throw new BadRequestException(
            'An IMEI product must not carry a serialNumber',
          );
        }
      }
    }
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
        imei: d.imei ?? d.serialNumber ?? null,
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
