import { Injectable, NotFoundException } from '@nestjs/common';
import { BonusService } from '../bonus/bonus.service.js';
import { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { StoresService } from '../stores/stores.service.js';
import { ListSalesQueryDto } from './dto/list-sales.query.dto.js';
import { SalesRepository } from './sales.repository.js';
import type {
  ReceiptView,
  SaleBonus,
  SaleView,
  WarrantyLookupView,
} from './types/sale.types.js';

const NO_BONUS: SaleBonus = { earned: '0.00', spent: '0.00' };

/**
 * Read side of sales: list, stats, lookups, receipt, and the view enrichment
 * (SALE ledger payments + a sale's trade-ins, ADR 0039). Split from the write
 * orchestration so each service has one reason to change.
 */
@Injectable()
export class SalesReadService {
  constructor(
    private readonly reads: SalesRepository,
    private readonly ledger: LedgerService,
    private readonly purchases: CustomerPurchasesService,
    private readonly bonus: BonusService,
    private readonly stores: StoresService,
    private readonly settings: SettingsService,
  ) {}

  async findByClientMutationId(id: string): Promise<SaleView | null> {
    const view = await this.reads.findByClientMutationId(id);
    return view ? this.withPayments(view) : null;
  }

  async list(query: ListSalesQueryDto) {
    const storeIds = await this.stores.currentStoreIds();
    const page = await this.reads.list(query, storeIds);
    return { ...page, items: await this.attachPayments(page.items) };
  }

  async stats(query: ListSalesQueryDto) {
    const storeIds = await this.stores.currentStoreIds();
    return this.reads.stats(query, storeIds);
  }

  get(id: string): Promise<SaleView> {
    return this.require(id);
  }

  async listByCustomer(customerId: string): Promise<SaleView[]> {
    return this.attachPayments(await this.reads.listByCustomer(customerId));
  }

  async warrantyLookup(imei: string): Promise<WarrantyLookupView> {
    const lookup = await this.reads.warrantyLookup(imei);
    if (!lookup) throw new NotFoundException(`No sale found for IMEI ${imei}`);
    return lookup;
  }

  async receipt(id: string): Promise<ReceiptView> {
    const storeIds = await this.stores.currentStoreIds();
    const receipt = await this.reads.receipt(id, storeIds);
    if (!receipt) throw new NotFoundException(`Sale ${id} not found`);
    const [payments, tradeIns, bonus, store, settings] = await Promise.all([
      this.ledger.salePayments([id]),
      this.purchases.tradeInsBySale([id]),
      this.bonus.summaryBySale([id]),
      this.stores.getIdentity(),
      this.settings.get(),
    ]);
    return {
      ...receipt,
      store: { name: store.name, address: store.address, phone: store.phone },
      footer: settings.receiptFooter,
      payments: payments.get(id) ?? [],
      tradeIns: tradeIns.get(id) ?? [],
      bonus: bonus.get(id) ?? NO_BONUS,
    };
  }

  async require(id: string): Promise<SaleView> {
    const storeIds = await this.stores.currentStoreIds();
    const sale = await this.reads.findById(id, storeIds);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return this.withPayments(sale);
  }

  /** Enrich one view with its payments, trade-ins and bonus points. */
  async withPayments(view: SaleView): Promise<SaleView> {
    const [payments, tradeIns, bonus] = await Promise.all([
      this.ledger.salePayments([view.id]),
      this.purchases.tradeInsBySale([view.id]),
      this.bonus.summaryBySale([view.id]),
    ]);
    return {
      ...view,
      payments: payments.get(view.id) ?? [],
      tradeIns: tradeIns.get(view.id) ?? [],
      bonus: bonus.get(view.id) ?? NO_BONUS,
    };
  }

  /** Fill each view's payments and bonus points (list paths). */
  private async attachPayments(views: SaleView[]): Promise<SaleView[]> {
    if (views.length === 0) return views;
    const ids = views.map((v) => v.id);
    const [payments, bonus] = await Promise.all([
      this.ledger.salePayments(ids),
      this.bonus.summaryBySale(ids),
    ]);
    return views.map((v) => ({
      ...v,
      payments: payments.get(v.id) ?? [],
      bonus: bonus.get(v.id) ?? NO_BONUS,
    }));
  }
}
