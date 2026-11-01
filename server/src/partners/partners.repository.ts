import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreatePartnerInput,
  CreatePaymentInput,
  CreditStatus,
  LedgerEntry,
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

/** All Prisma access for partners, their balances, ledger and payments. */
@Injectable()
export class PartnersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listWithBalance(): Promise<PartnerView[]> {
    const rows = await this.prisma.$queryRaw<BalanceRow[]>(
      Prisma.sql`${balanceSelect} ${balanceFrom} ORDER BY p."shopName" ASC`,
    );
    return rows.map(toPartnerView);
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
    const row = await this.prisma.partnerPayment.create({
      data: {
        partnerId: input.partnerId,
        consignmentId: input.consignmentId,
        amount: input.amount,
        paidAt: input.paidAt,
        notes: input.notes,
        receivedById: input.receivedById,
      },
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

type ConsignmentLedgerRow = {
  id: string;
  agreedPrice: Prisma.Decimal;
  consignedAt: Date;
  statusCode: string;
  resolvedAt: Date | null;
  notes: string | null;
};

type PaymentLedgerRow = {
  id: string;
  amount: Prisma.Decimal;
  paidAt: Date;
  notes: string | null;
};

/** Charge at consignedAt; reverse RETURNED at resolvedAt; credit payments. */
function buildLedger(
  consignments: ConsignmentLedgerRow[],
  payments: PaymentLedgerRow[],
): LedgerEntry[] {
  const events: Omit<LedgerEntry, 'runningBalance'>[] = [];
  for (const c of consignments) {
    events.push({
      at: c.consignedAt,
      kind: 'consignment',
      refId: c.id,
      change: c.agreedPrice,
      statusCode: c.statusCode,
      notes: c.notes,
    });
    if (c.statusCode === 'RETURNED' && c.resolvedAt) {
      events.push({
        at: c.resolvedAt,
        kind: 'consignment',
        refId: c.id,
        change: c.agreedPrice.negated(),
        statusCode: 'RETURNED',
        notes: c.notes,
      });
    }
  }
  for (const p of payments) {
    events.push({
      at: p.paidAt,
      kind: 'payment',
      refId: p.id,
      change: p.amount.negated(),
      statusCode: null,
      notes: p.notes,
    });
  }
  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  let running = new Prisma.Decimal(0);
  return events.map((e) => {
    running = running.plus(e.change);
    return { ...e, runningBalance: running };
  });
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
