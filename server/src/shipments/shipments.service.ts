import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { isUniqueViolation } from '../common/lib/prisma-errors.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomsService } from '../customs/customs.service.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import type { DeviceModelView } from '../device-models/types/device-model.types.js';
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
import { ImportShipmentDto } from './dto/import-shipment.dto.js';
import {
  RegisterDeviceDto,
  RegisterDevicesDto,
} from './dto/register-devices.dto.js';
import { UpdateShipmentDto } from './dto/update-shipment.dto.js';
import { RegisterItemsDto } from './dto/register-items.dto.js';
import { validateAndPrepareBatchImport } from './lib/batch-import-validator.js';
import {
  assertExpensePermission,
  assertKindRules,
  assertSpecs,
} from './lib/shipment-intake-validation.js';
import { stampCustomsFees } from './lib/shipment-stamp-fees.js';
import {
  str,
  sumLineTotals,
  toStockLineViews,
} from './lib/shipment-stock-lines.js';
import { ShipmentsIntakeRepository } from './shipments-intake.repository.js';
import { ShipmentsQuantityRepository } from './shipments-quantity.repository.js';
import { ShipmentsRepository } from './shipments.repository.js';
import {
  ImportShipmentResultView,
  RegisteredDeviceView,
  RegisterDeviceInput,
  ShipmentDetailView,
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

  async list(): Promise<ShipmentView[]> {
    const storeIds = await this.stores.currentStoreIds();
    const views = await this.repo.findAll(storeIds);
    const totals = await this.stock.purchaseTotalsByShipment(
      views.map((v) => v.id),
    );
    return views.map((v) => ({ ...v, stockLinesTotal: str(totals.get(v.id)) }));
  }

  /** Shipment detail + its quantity PURCHASE lines via StockService (ADR 0030). */
  async get(
    caller: AuthenticatedUser,
    id: string,
  ): Promise<ShipmentDetailView> {
    const view = await this.require(id);
    const lines = await this.stock.shipmentPurchaseLines(id);
    return {
      ...view,
      stockLinesTotal: sumLineTotals(lines),
      stockLines: toStockLineViews(
        lines,
        caller.permissions.has('device.cost.view'),
      ),
    };
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
    assertKindRules(dto.devices, models);
    assertSpecs(dto.devices, models);
    assertExpensePermission(
      dto.devices.some((d) => (d.unitExpense ?? 0) !== 0),
      user,
    );
    const feeByCode = await this.customs.currentFeeMap();
    const inputs = stampCustomsFees(dto.devices, models, feeByCode);
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

  private async validateImport(
    dto: ImportShipmentDto,
    user: AuthenticatedUser,
  ) {
    assertExpensePermission(
      dto.rows.some((r) => r.expense > 0),
      user,
    );
    await this.suppliers.get(dto.supplierId);
    const allModels = await this.models.list();
    const allImeis = dto.rows.flatMap((r) =>
      [r.imei, r.imei2].filter((x): x is string => !!x),
    );
    const existingImeis = await this.intake.findExistingImeis(allImeis);
    const feeMap = await this.customs.currentFeeMap();

    const result = validateAndPrepareBatchImport(
      dto.rows,
      dto.exchangeRate,
      allModels,
      new Set(existingImeis),
      feeMap,
    );

    if (result.problems.length > 0) {
      throw new BadRequestException({
        message: 'Import failed validation',
        problems: result.problems,
      });
    }

    return { ...result, allModels };
  }

  async importShipment(
    dto: ImportShipmentDto,
    user: AuthenticatedUser,
  ): Promise<ImportShipmentResultView> {
    const { deviceInputs, warnings, allModels } = await this.validateImport(
      dto,
      user,
    );

    const { shipment, devices } = await this.intake.createShipmentWithDevices(
      {
        storeId: dto.storeId,
        supplierId: dto.supplierId,
        shipmentDate: new Date(dto.shipmentDate),
        expectedCount: dto.rows.length,
        paymentAccountCode: dto.paymentAccountCode,
        exchangeRate: dto.exchangeRate,
        notes: dto.notes,
        createdById: user.id,
      },
      deviceInputs,
      user.id,
    );

    void this.announce(
      dto.supplierId,
      shipment.id,
      devices.length,
      allModels.filter((m) => deviceInputs.some((d) => d.modelId === m.id)),
    ).catch(() => undefined);

    const fresh = await this.require(shipment.id);
    return { ...fresh, devices, warnings };
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

  private async require(id: string): Promise<ShipmentView> {
    const storeIds = await this.stores.currentStoreIds();
    const shipment = await this.repo.findById(id, storeIds);
    if (!shipment) throw new NotFoundException(`Shipment ${id} not found`);
    const totals = await this.stock.purchaseTotalsByShipment([id]);
    return { ...shipment, stockLinesTotal: str(totals.get(id)) };
  }
}
