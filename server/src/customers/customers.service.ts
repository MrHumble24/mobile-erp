import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BonusService } from '../bonus/bonus.service.js';
import { CreditsReadService } from '../credits/credits-read.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { SalesService } from '../sales/sales.service.js';
import { CustomersRepository } from './customers.repository.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { ListCustomersQueryDto } from './dto/list-customers.query.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { aggregateSales } from './lib/customer-aggregates.js';
import { normalizeUzPhone } from './lib/customer-phone.js';
import { sortCustomers } from './lib/customer-query.js';
import type {
  CustomerListItem,
  CustomerPage,
  CustomerStats,
  CustomerView,
} from './types/customer.types.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly repo: CustomersRepository,
    private readonly sales: SalesService,
    private readonly pricing: PricingService,
    private readonly credits: CreditsReadService,
    private readonly bonus: BonusService,
  ) {}

  /** POS typeahead; carries each match's points balance when bonus is on. */
  async lookup(query?: string): Promise<CustomerView[]> {
    const rows = await this.repo.lookup(query);
    const { enabled } = await this.bonus.config();
    if (!enabled || rows.length === 0) return rows;
    const balances = await this.bonus.balancesFor(rows.map((r) => r.id));
    return rows.map((r) => ({
      ...r,
      bonusBalance: balances.get(r.id) ?? '0.00',
    }));
  }

  async list(query: ListCustomersQueryDto): Promise<CustomerPage> {
    const hasPurchases =
      query.hasPurchases === undefined
        ? undefined
        : query.hasPurchases === 'true';
    const rows = await this.repo.findMany(query.search, hasPurchases);
    // ponytail: aggregates fetched per-customer via SalesService (N+1), fine at
    // single-shop scale. Upgrade: add a batch aggregate method to SalesService.
    const items = await Promise.all(rows.map((c) => this.toListItem(c)));
    sortCustomers(items, query.sort);

    const start = (query.page - 1) * query.pageSize;
    return {
      items: items.slice(start, start + query.pageSize),
      total: items.length,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  stats(): Promise<CustomerStats> {
    return this.repo.stats();
  }

  async get(id: string): Promise<CustomerListItem> {
    const customer = await this.require(id);
    return this.toListItem(customer);
  }

  async create(dto: CreateCustomerDto): Promise<CustomerView> {
    const phone = normalizeUzPhone(dto.phone);
    await this.assertPhoneFree(phone);
    if (dto.priceLevelCode) await this.pricing.assertLevel(dto.priceLevelCode);
    return this.repo.create({
      name: dto.name,
      phone,
      notes: dto.notes,
      priceLevelCode: dto.priceLevelCode,
      standingDiscountPercent: dto.standingDiscountPercent,
      creditLimit: dto.creditLimit,
    });
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerView> {
    await this.require(id);
    const phone = normalizeUzPhone(dto.phone);
    await this.assertPhoneFree(phone, id);
    if (dto.priceLevelCode) await this.pricing.assertLevel(dto.priceLevelCode);
    return this.repo.update(id, {
      name: dto.name,
      phone,
      notes: dto.notes,
      priceLevelCode: dto.priceLevelCode,
      standingDiscountPercent: dto.standingDiscountPercent,
      creditLimit: dto.creditLimit,
    });
  }

  private async toListItem(customer: CustomerView): Promise<CustomerListItem> {
    const [sales, credit] = await Promise.all([
      this.sales.listByCustomer(customer.id),
      this.credits.customerSummary(customer.id),
    ]);
    return {
      ...customer,
      ...aggregateSales(sales),
      creditOutstanding: credit.outstanding,
      creditOverdue: credit.overdueAmount,
      effectiveCreditLimit: credit.effectiveLimit,
    };
  }

  private async assertPhoneFree(
    phone?: string,
    exceptId?: string,
  ): Promise<void> {
    if (!phone) return;
    const existing = await this.repo.findByPhone(phone);
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `A customer with phone ${phone} already exists`,
      );
    }
  }

  private async require(id: string): Promise<CustomerView> {
    const customer = await this.repo.findById(id);
    if (!customer) throw new NotFoundException(`Customer ${id} not found`);
    return customer;
  }
}
