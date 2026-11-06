import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { resolveCustomerId } from '../common/lib/resolve-customer.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import { validateSpecs } from '../device-models/lib/attribute-schema.js';
import { assertUnitKind, normalizeSerial } from '../devices/lib/unit-code.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ShiftsService } from '../shifts/shifts.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CustomerPurchasesRepository } from './customer-purchases.repository.js';
import { CustomerPurchasesWriteRepository } from './customer-purchases.write.repository.js';
import { CreateCustomerPurchaseDto } from './dto/create-customer-purchase.dto.js';
import { ListCustomerPurchasesQueryDto } from './dto/list-customer-purchases.query.dto.js';
import {
  toPurchaseView,
  toTradeInView,
} from './lib/customer-purchase.mapper.js';
import type {
  CustomerPurchasePage,
  CustomerPurchaseView,
  PurchaseUnitInput,
  TradeInView,
} from './types/customer-purchase.types.js';

/**
 * Buying used phones from customers (Change 14, ADR 0039). Owns the plain-buy
 * endpoint; the trade-in path reuses the write repository (one implementation).
 * NO passport data is stored — the seller is a Customer (name + phone only).
 */
@Injectable()
export class CustomerPurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: CustomerPurchasesRepository,
    private readonly writes: CustomerPurchasesWriteRepository,
    private readonly models: DeviceModelsService,
    private readonly ledger: LedgerService,
    private readonly stores: StoresService,
    private readonly shifts: ShiftsService,
  ) {}

  /** Buy one used unit from a customer, posting the money out of the balance. */
  async create(
    caller: AuthenticatedUser,
    dto: CreateCustomerPurchaseDto,
  ): Promise<CustomerPurchaseView> {
    // Shift gate (ADR 0036): cash leaving the drawer needs an open shift.
    await this.shifts.assertCanSell(caller);
    const unit = await this.prepareUnit(dto);
    const accountCode = dto.accountCode ?? 'CASH';
    if (!(await this.ledger.activeAccountCodes()).includes(accountCode)) {
      throw new BadRequestException(
        `Unknown or inactive account ${accountCode}`,
      );
    }
    const customerId = await this.resolveSeller(dto);
    const storeId = await this.stores.currentStoreId();
    const { purchaseId } = await this.writes.create({
      storeId,
      customerId,
      pricePaid: dto.pricePaid,
      unit,
      createdById: caller.id,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      ledgerAccountCode: accountCode,
    });
    return this.get(purchaseId);
  }

  /**
   * Validate and normalise one unit against its model (kind + specs). Shared by
   * the plain buy and, via `PurchaseUnitInput`, by a sale's trade-in prep.
   */
  async prepareUnit(dto: {
    modelId: string;
    imei?: string;
    imei2?: string;
    serialNumber?: string;
    specs?: Record<string, unknown>;
  }): Promise<PurchaseUnitInput> {
    const model = await this.models.get(dto.modelId);
    assertUnitKind(model.kindCode, dto);
    const specs = dto.specs ?? {};
    const problems = validateSpecs(model.attributes, specs);
    if (problems.length > 0) {
      throw new BadRequestException({ message: 'Invalid specs', problems });
    }
    return {
      imei: dto.imei,
      imei2: dto.imei2,
      serialNumber: dto.serialNumber
        ? normalizeSerial(dto.serialNumber)
        : undefined,
      modelId: dto.modelId,
      specs,
    };
  }

  async list(
    query: ListCustomerPurchasesQueryDto,
  ): Promise<CustomerPurchasePage> {
    const storeIds = await this.stores.currentStoreIds();
    const { items, total } = await this.repo.list(storeIds, query);
    const accounts = await this.ledger.customerPurchaseAccounts(
      items.map((i) => i.id),
    );
    return {
      items: items.map((i) => toPurchaseView(i, accounts.get(i.id) ?? null)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async get(id: string): Promise<CustomerPurchaseView> {
    const storeIds = await this.stores.currentStoreIds();
    const row = await this.repo.findById(id, storeIds);
    if (!row) throw new NotFoundException(`Customer purchase ${id} not found`);
    const account = (await this.ledger.customerPurchaseAccounts([id])).get(id);
    return toPurchaseView(row, account ?? null);
  }

  /** Σ pricePaid of a sale's trade-ins — the refund-cap top-up (ADR 0039). */
  tradeInTotalForSale(saleId: string): Promise<Prisma.Decimal> {
    return this.repo.tradeInTotalForSale(saleId);
  }

  /** True once a sold unit has been bought back (ADR 0044) — blocks its return. */
  wasUnitBoughtBackAfter(deviceId: string, after: Date): Promise<boolean> {
    return this.repo.boughtBackAfter(deviceId, after);
  }

  /** The trade-ins on each sale, for the sale/receipt views. */
  async tradeInsBySale(saleIds: string[]): Promise<Map<string, TradeInView[]>> {
    const rows = await this.repo.findTradeInsForSales(saleIds);
    const map = new Map<string, TradeInView[]>();
    for (const row of rows) {
      if (!row.saleId) continue;
      const list = map.get(row.saleId) ?? [];
      list.push(toTradeInView(row));
      map.set(row.saleId, list);
    }
    return map;
  }

  /** Resolve an existing seller id, or create/find one from name + phone. */
  private async resolveSeller(dto: CreateCustomerPurchaseDto): Promise<string> {
    if (dto.customerId) {
      const found = await this.prisma.customer.findUnique({
        where: { id: dto.customerId },
        select: { id: true },
      });
      if (!found) {
        throw new BadRequestException(`Customer ${dto.customerId} not found`);
      }
      return found.id;
    }
    const id = await resolveCustomerId(this.prisma, {
      inlineCustomer: dto.customer,
    });
    if (!id) {
      throw new BadRequestException(
        'A purchase needs a seller: customerId or a name (and phone)',
      );
    }
    return id;
  }
}
