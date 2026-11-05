import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgingBucket, bucketOpenConsignments } from './lib/aging.js';
import { buildLedger } from './lib/ledger.js';
import {
  CreatePartnerInput,
  CreatePaymentInput,
  CreditStatus,
  LedgerEntry,
  PartnerFilters,
  PartnerView,
  PaymentView,
} from './types/partner.types.js';

/** Raw row from the balance aggregate; Postgres returns numerics as strings. */
interface BalanceRow {
  id: string;
  shopName: string;
  contactPerson: string | null;
  phone: string | null;
  telegramHandle: string | null;
  creditLimit: string;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  outstanding: string;
  openCount: bigint;
  overdueCount: bigint;
}

/**
 * Outstanding / open / overdue per partner in one aggregate query — never a
 * JS loop over consignment rows. Interpolate a WHERE/ORDER fragment to reuse.
 */
const balanceFrom = Prisma.sql`
  FROM partners p
  LEFT JOIN (
    SELECT "partnerId",
      SUM("agreedPrice") FILTER (WHERE "statusCode" <> 'RETURNED') AS charges,
      COUNT(*) FILTER (WHERE "statusCode" = 'OUT') AS open_count,
      COUNT(*) FILTER (WHERE "statusCode" = 'OUT' AND "dueDate" < now()) AS overdue_count
    FROM consignments GROUP BY "partnerId"
  ) c ON c."partnerId" = p.id
  LEFT JOIN (
    SELECT "partnerId", SUM(amount) AS paid
    FROM partner_payments GROUP BY "partnerId"
  ) pay ON pay."partnerId" = p.id
`;

const balanceSelect = Prisma.sql`
  SELECT p.id, p."shopName", p."contactPerson", p.phone, p."telegramHandle",
    p."creditLimit", p.notes, p."isActive", p."createdAt",
    COALESCE(c.charges, 0) - COALESCE(pay.paid, 0) AS outstanding,
    COALESCE(c.open_count, 0) AS "openCount",
    COALESCE(c.overdue_count, 0) AS "overdueCount"
`;

/** Directory filters as a WHERE fragment over the balance query. */
function balanceWhere(filters: PartnerFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  const term = filters.search?.trim();
  if (term) {
    const like = `%${term}%`;
    conditions.push(
      Prisma.sql`(p."shopName" ILIKE ${like} OR p."contactPerson" ILIKE ${like} OR p.phone ILIKE ${like})`,
    );
  }
  if (filters.active !== undefined) {
    conditions.push(Prisma.sql`p."isActive" = ${filters.active}`);
  }
  if (filters.overdue) {
    conditions.push(Prisma.sql`COALESCE(c.overdue_count, 0) > 0`);
  }
  if (conditions.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}

/** All Prisma access for partners, their balances, ledger and payments. */
@Injectable()
export class PartnersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async listWithBalance(filters: PartnerFilters = {}): Promise<PartnerView[]> {
    const rows = await this.prisma.$queryRaw<BalanceRow[]>(
      Prisma.sql`${balanceSelect} ${balanceFrom} ${balanceWhere(filters)} ORDER BY p."shopName" ASC`,
    );
    return rows.map(toPartnerView);
  }

  /** OUT consignments (dueDate, agreedPrice) for the aging buckets. */
  async aging(partnerId: string): Promise<AgingBucket[]> {
    const rows = await this.prisma.consignment.findMany({
      where: { partnerId, statusCode: 'OUT' },
      select: { dueDate: true, agreedPrice: true },
    });
    return bucketOpenConsignments(rows);
  }

  async findWithBalance(id: string): Promise<PartnerView | null> {
    const rows = await this.prisma.$queryRaw<BalanceRow[]>(
      Prisma.sql`${balanceSelect} ${balanceFrom} WHERE p.id = ${id}`,
    );
    return rows[0] ? toPartnerView(rows[0]) : null;
  }

  async getCreditStatus(id: string): Promise<CreditStatus | null> {
    const partner = await this.findWithBalance(id);
    return partner
      ? { creditLimit: partner.creditLimit, outstanding: partner.outstanding }
      : null;
  }

  exists(id: string): Promise<boolean> {
    return this.prisma.partner.count({ where: { id } }).then((n) => n > 0);
  }

  async create(input: CreatePartnerInput): Promise<PartnerView> {
    const row = await this.prisma.partner.create({ data: input });
    return (await this.findWithBalance(row.id))!;
  }

  async update(
    id: string,
    data: Partial<CreatePartnerInput> & { isActive?: boolean },
  ): Promise<PartnerView> {
    await this.prisma.partner.update({ where: { id }, data });
    return (await this.findWithBalance(id))!;
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentView> {
    const row = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.partnerPayment.create({
        data: {
          storeId: input.storeId,
          partnerId: input.partnerId,
          consignmentId: input.consignmentId,
          amount: input.amount,
          paidAt: input.paidAt,
          notes: input.notes,
          receivedById: input.receivedById,
        },
      });
      await this.ledgerService.post(
        {
          storeId: input.storeId,
          accountCode: input.accountCode,
          typeCode: 'PARTNER_PAYMENT',
          amount: input.amount,
          occurredAt: input.paidAt,
          partnerPaymentId: payment.id,
          createdById: input.receivedById,
        },
        tx,
      );
      return payment;
    });
    return {
      id: row.id,
      partnerId: row.partnerId,
      consignmentId: row.consignmentId,
      amount: row.amount,
      paidAt: row.paidAt,
      notes: row.notes,
      receivedById: row.receivedById,
      createdAt: row.createdAt,
      accountCode: input.accountCode,
    };
  }

  consignmentBelongsTo(id: string, partnerId: string): Promise<boolean> {
    return this.prisma.consignment
      .count({ where: { id, partnerId } })
      .then((n) => n > 0);
  }

  /** Chronological ledger with running balance (sequential by nature). */
  async ledger(partnerId: string): Promise<LedgerEntry[]> {
    const [consignments, payments] = await Promise.all([
      this.prisma.consignment.findMany({
        where: { partnerId },
        select: {
          id: true,
          agreedPrice: true,
          consignedAt: true,
          statusCode: true,
          resolvedAt: true,
          notes: true,
        },
      }),
      this.prisma.partnerPayment.findMany({
        where: { partnerId },
        select: { id: true, amount: true, paidAt: true, notes: true },
      }),
    ]);
    return buildLedger(consignments, payments);
  }
}

function toPartnerView(row: BalanceRow): PartnerView {
  return {
    id: row.id,
    shopName: row.shopName,
    contactPerson: row.contactPerson,
    phone: row.phone,
    telegramHandle: row.telegramHandle,
    creditLimit: new Prisma.Decimal(row.creditLimit),
    notes: row.notes,
    isActive: row.isActive,
    createdAt: row.createdAt,
    outstanding: new Prisma.Decimal(row.outstanding),
    openCount: Number(row.openCount),
    overdueCount: Number(row.overdueCount),
  };
}
