import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { ListSalesQueryDto } from './dto/list-sales.query.dto.js';
import { SalesRepository } from './sales.repository.js';
import type {
  ReceiptView,
  SaleView,
  WarrantyLookupView,
} from './types/sale.types.js';

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
  ) {}

  async findByClientMutationId(id: string): Promise<SaleView | null> {
    const view = await this.reads.findByClientMutationId(id);
    return view ? this.withPayments(view) : null;
  }

  async list(query: ListSalesQueryDto) {
    const page = await this.reads.list(query);
    return { ...page, items: await this.attachPayments(page.items) };
  }

  stats(query: ListSalesQueryDto) {
    return this.reads.stats(query);
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
    const receipt = await this.reads.receipt(id);
    if (!receipt) throw new NotFoundException(`Sale ${id} not found`);
    const [payments, tradeIns] = await Promise.all([
      this.ledger.salePayments([id]),
      this.purchases.tradeInsBySale([id]),
    ]);
    return {
      ...receipt,
      payments: payments.get(id) ?? [],
      tradeIns: tradeIns.get(id) ?? [],
    };
  }

  async require(id: string): Promise<SaleView> {
    const sale = await this.reads.findById(id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return this.withPayments(sale);
  }

  /** Enrich one view with its payments and trade-ins. */
  async withPayments(view: SaleView): Promise<SaleView> {
    const [payments, tradeIns] = await Promise.all([
      this.ledger.salePayments([view.id]),
      this.purchases.tradeInsBySale([view.id]),
    ]);
    return {
      ...view,
      payments: payments.get(view.id) ?? [],
      tradeIns: tradeIns.get(view.id) ?? [],
    };
  }

  /** Fill each view's `payments` from its SALE ledger rows (list path). */
  private async attachPayments(views: SaleView[]): Promise<SaleView[]> {
    if (views.length === 0) return views;
    const map = await this.ledger.salePayments(views.map((v) => v.id));
    return views.map((v) => ({ ...v, payments: map.get(v.id) ?? [] }));
  }
}
