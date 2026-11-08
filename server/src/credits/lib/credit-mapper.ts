import { Prisma } from '../../generated/client/client.js';
import { CreateSaleDto } from '../../sales/dto/create-sale.dto.js';
import type { CreditRaw } from '../credits.repository.js';
import type { CreditLineDto } from '../dto/create-credit.dto.js';
import type {
  CreditListItem,
  CreditSaleView,
  CreditView,
} from '../types/credit.types.js';
import {
  computeCreditStanding,
  type CreditMathInput,
  type CreditStanding,
} from './credit-math.js';

/** A credit line → the DTO the normal checkout path consumes. */
export function toSaleDto(line: CreditLineDto): CreateSaleDto {
  return Object.assign(new CreateSaleDto(), {
    imei: line.imei,
    serialNumber: line.serialNumber,
    modelId: line.modelId,
    quantity: line.quantity,
    salePrice: line.salePrice,
    priceLevelCode: line.priceLevelCode,
    discount: line.discount,
    warrantyDays: line.warrantyDays,
    notes: line.notes,
  });
}

/** The credit's math inputs: only not-returned sales count toward the total. */
export function toMathInput(raw: CreditRaw, now: Date): CreditMathInput {
  return {
    salePrices: raw.sales
      .filter((s) => s.return === null)
      .map((s) => s.salePrice),
    paymentAmounts: raw.payments.map((p) => p.amount),
    instalments: raw.instalments.map((i) => ({
      id: i.id,
      dueDate: i.dueDate,
      amount: i.amount,
    })),
    now,
  };
}

export function standingOf(raw: CreditRaw, now: Date): CreditStanding {
  return computeCreditStanding(toMathInput(raw, now));
}

export function toCreditView(
  raw: CreditRaw,
  standing: CreditStanding,
): CreditView {
  // The margin is a disclosed part of the agreed price, never growth on top of
  // it: cashPrice + markupAmount = agreedTotal. Both are frozen at creation.
  const markup = raw.markupAmount ?? new Prisma.Decimal(0);
  return {
    id: raw.id,
    cashPrice: standing.agreedTotal.minus(markup).toFixed(2),
    markupAmount: markup.toFixed(2),
    customer: raw.customer,
    createdBy: { id: raw.createdBy.id, name: fullName(raw.createdBy.profile) },
    note: raw.note,
    createdAt: raw.createdAt,
    sales: raw.sales.map(toSaleView),
    instalments: standing.instalments.map((i) => ({
      id: i.id,
      dueDate: i.dueDate,
      amount: i.amount.toFixed(2),
      paid: i.paid.toFixed(2),
      overdue: i.overdue,
    })),
    payments: raw.payments.map((p) => ({
      id: p.id,
      accountCode: p.accountCode,
      amount: p.amount.toFixed(2),
      occurredAt: p.occurredAt,
      receivedBy: { id: p.receivedBy.id, name: fullName(p.receivedBy.profile) },
    })),
    agreedTotal: standing.agreedTotal.toFixed(2),
    paid: standing.paid.toFixed(2),
    outstanding: standing.outstanding.toFixed(2),
    overpaid: standing.overpaid.toFixed(2),
    overdueAmount: standing.overdueAmount.toFixed(2),
    settled: standing.settled,
  };
}

export function toListItem(
  raw: CreditRaw,
  standing: CreditStanding,
): CreditListItem {
  return {
    id: raw.id,
    customer: raw.customer,
    createdAt: raw.createdAt,
    agreedTotal: standing.agreedTotal.toFixed(2),
    paid: standing.paid.toFixed(2),
    outstanding: standing.outstanding.toFixed(2),
    overdueAmount: standing.overdueAmount.toFixed(2),
    settled: standing.settled,
  };
}

function toSaleView(s: CreditRaw['sales'][number]): CreditSaleView {
  const ref = s.device?.model ?? s.model;
  return {
    saleId: s.id,
    imei: s.device?.imei ?? null,
    serialNumber: s.device?.serialNumber ?? null,
    model: ref ? `${ref.brand} ${ref.name}` : '',
    quantity: s.quantity,
    salePrice: s.salePrice.toFixed(2),
    returnedAt: s.return?.returnedAt ?? null,
  };
}

function fullName(
  profile: { firstName: string; lastName: string | null } | null,
): string {
  if (!profile) return '';
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}
