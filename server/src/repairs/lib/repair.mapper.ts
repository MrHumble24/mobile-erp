import { Prisma } from '../../generated/client/client.js';
import type { RepairRaw } from '../repairs.repository.js';
import type {
  RepairListItem,
  RepairMasterView,
  RepairPartView,
  RepairPaymentView,
  RepairStatusHistoryView,
  RepairView,
} from '../types/repair.types.js';
import { computeRepairFinance, type RepairFinance } from './repair-math.js';

type Profile = { firstName: string; lastName: string | null } | null;

export function financeOf(
  raw: RepairRaw,
  outsidePaid: Prisma.Decimal,
  now: Date,
): RepairFinance {
  return computeRepairFinance({
    agreedPrice: raw.agreedPrice,
    paymentAmounts: raw.payments.map((p) => p.amount),
    parts: raw.parts.map((p) => ({
      quantity: p.quantity,
      unitCostSnapshot: p.unitCostSnapshot,
    })),
    outsidePaid,
    givenBackAt: givenBackAtOf(raw),
    warrantyDays: raw.warrantyDays,
    now,
  });
}

export function toRepairView(
  raw: RepairRaw,
  outsidePaid: Prisma.Decimal,
  canViewCost: boolean,
  now: Date,
): RepairView {
  const fin = financeOf(raw, outsidePaid, now);
  const money = (d: Prisma.Decimal): string | null =>
    canViewCost ? d.toFixed(2) : null;
  return {
    id: raw.id,
    ticketNumber: raw.ticketNumber,
    customer: raw.customer,
    deviceName: raw.deviceName,
    modelId: raw.modelId,
    model: raw.model ? `${raw.model.brand} ${raw.model.name}` : null,
    imei: raw.imei,
    serialNumber: raw.serialNumber,
    problem: raw.problem,
    agreedPrice: raw.agreedPrice.toFixed(2),
    warrantyDays: raw.warrantyDays,
    notes: raw.notes,
    master: masterOf(raw),
    outsideCost: raw.outsideCost ? money(raw.outsideCost) : null,
    statusCode: raw.statusCode,
    statusLabel: raw.status.label,
    isTerminal: raw.status.isTerminal,
    receivedBy: {
      id: raw.receivedBy.id,
      name: fullName(raw.receivedBy.profile),
    },
    receivedAt: raw.receivedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    parts: raw.parts.map((p) => toPartView(p, money)),
    payments: raw.payments.map(toPaymentView),
    statusHistory: raw.statusHistory.map(toHistoryView),
    paid: fin.paid.toFixed(2),
    outstanding: fin.outstanding.toFixed(2),
    partsCost: money(fin.partsCost),
    outsidePaid: money(fin.outsidePaid),
    profit: money(fin.profit),
    givenBackAt: givenBackAtOf(raw),
    warrantyUntil: fin.warrantyUntil,
    underWarranty: fin.underWarranty,
  };
}

export function toListItem(
  raw: RepairRaw,
  outsidePaid: Prisma.Decimal,
  now: Date,
): RepairListItem {
  const fin = financeOf(raw, outsidePaid, now);
  return {
    id: raw.id,
    ticketNumber: raw.ticketNumber,
    customer: raw.customer,
    deviceName: raw.deviceName,
    imei: raw.imei,
    statusCode: raw.statusCode,
    statusLabel: raw.status.label,
    isTerminal: raw.status.isTerminal,
    agreedPrice: raw.agreedPrice.toFixed(2),
    paid: fin.paid.toFixed(2),
    outstanding: fin.outstanding.toFixed(2),
    receivedAt: raw.receivedAt,
    warrantyUntil: fin.warrantyUntil,
    underWarranty: fin.underWarranty,
  };
}

type Money = (d: Prisma.Decimal) => string | null;

function toPartView(
  p: RepairRaw['parts'][number],
  money: Money,
): RepairPartView {
  return {
    id: p.id,
    modelId: p.modelId,
    name: `${p.model.brand} ${p.model.name}`,
    quantity: p.quantity,
    partUnitCost: money(p.unitCostSnapshot),
    partLineCost: money(p.unitCostSnapshot.times(p.quantity)),
    addedBy: { id: p.addedBy.id, name: fullName(p.addedBy.profile) },
    createdAt: p.createdAt,
  };
}

function toPaymentView(p: RepairRaw['payments'][number]): RepairPaymentView {
  return {
    id: p.id,
    accountCode: p.accountCode,
    amount: p.amount.toFixed(2),
    occurredAt: p.occurredAt,
    receivedBy: { id: p.receivedBy.id, name: fullName(p.receivedBy.profile) },
  };
}

function toHistoryView(
  h: RepairRaw['statusHistory'][number],
): RepairStatusHistoryView {
  return {
    fromStatusCode: h.fromStatusCode,
    toStatusCode: h.toStatusCode,
    note: h.note,
    changedBy: { id: h.changedBy.id, name: fullName(h.changedBy.profile) },
    changedAt: h.changedAt,
  };
}

/** The instant of the latest move into GIVEN_BACK, or null (ADR 0040). */
export function givenBackAtOf(raw: RepairRaw): Date | null {
  let at: Date | null = null;
  for (const h of raw.statusHistory) {
    if (h.toStatusCode === 'GIVEN_BACK') at = h.changedAt;
  }
  return at;
}

function masterOf(raw: RepairRaw): RepairMasterView {
  if (raw.master) {
    return {
      kind: 'OWN',
      userId: raw.master.id,
      name: fullName(raw.master.profile),
    };
  }
  if (raw.outsideMasterName) {
    return {
      kind: 'OUTSIDE',
      name: raw.outsideMasterName,
      phone: raw.outsideMasterPhone,
    };
  }
  return null;
}

function fullName(profile: Profile): string {
  if (!profile) return '';
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}
