/**
 * Response shapes for repairs (ADR 0040). All money is a 2-dp string. Cost
 * figures (partUnitCost, partLineCost, partsCost, outsideCost, outsidePaid,
 * profit) are null for a caller without `device.cost.view`; customer-facing
 * money (agreedPrice, paid, outstanding, income) is always shown.
 */

/** Who repairs the phone: the shop's own master, or an outside one. */
export type RepairMasterView =
  | { kind: 'OWN'; userId: string; name: string }
  | { kind: 'OUTSIDE'; name: string; phone: string | null }
  | null;

export interface RepairPartView {
  id: string;
  modelId: string;
  name: string;
  quantity: number;
  /** Cost per piece frozen when taken; null without the cost permission. */
  partUnitCost: string | null;
  /** quantity × partUnitCost; null without the cost permission. */
  partLineCost: string | null;
  addedBy: { id: string; name: string };
  createdAt: Date;
}

export interface RepairPaymentView {
  id: string;
  accountCode: string;
  /** Signed: positive = payment in, negative = refund out. */
  amount: string;
  occurredAt: Date;
  receivedBy: { id: string; name: string };
}

export interface RepairStatusHistoryView {
  fromStatusCode: string | null;
  toStatusCode: string;
  note: string | null;
  changedBy: { id: string; name: string };
  changedAt: Date;
}

export interface RepairView {
  id: string;
  ticketNumber: number;
  customer: { id: string; name: string; phone: string | null };
  deviceName: string;
  modelId: string | null;
  model: string | null;
  imei: string | null;
  serialNumber: string | null;
  problem: string;
  agreedPrice: string;
  warrantyDays: number;
  notes: string | null;
  master: RepairMasterView;
  /** Agreed amount for the outside master; null for own-master or without cost permission. */
  outsideCost: string | null;
  statusCode: string;
  statusLabel: string;
  isTerminal: boolean;
  receivedBy: { id: string; name: string };
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  parts: RepairPartView[];
  payments: RepairPaymentView[];
  statusHistory: RepairStatusHistoryView[];
  /** Σ payments (net of refunds), customer money. */
  paid: string;
  /** agreedPrice − paid; may be negative if overpaid. */
  outstanding: string;
  /** Σ parts cost; null without the cost permission. */
  partsCost: string | null;
  /** Σ paid to the outside master; null without the cost permission. */
  outsidePaid: string | null;
  /** paid − partsCost − outsidePaid; null without the cost permission. */
  profit: string | null;
  /** When the ticket was given back (null until then). */
  givenBackAt: Date | null;
  /** givenBackAt + warrantyDays; null until given back or if no warranty. */
  warrantyUntil: Date | null;
  underWarranty: boolean;
}

export interface RepairListItem {
  id: string;
  ticketNumber: number;
  customer: { id: string; name: string; phone: string | null };
  deviceName: string;
  imei: string | null;
  statusCode: string;
  statusLabel: string;
  isTerminal: boolean;
  agreedPrice: string;
  paid: string;
  outstanding: string;
  receivedAt: Date;
  warrantyUntil: Date | null;
  underWarranty: boolean;
}

export interface RepairPage {
  items: RepairListItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** Derived repair figures over a date range, under the finance/cost permission. */
export interface RepairReport {
  from: Date | null;
  to: Date | null;
  /** Σ customer payments in range (net of refunds). Always shown. */
  income: string;
  /** Σ parts cost in range; null without the cost permission. */
  partsCost: string | null;
  /** Σ paid to outside masters in range; null without the cost permission. */
  outsideCost: string | null;
  /** income − partsCost − outsideCost; null without the cost permission. */
  profit: string | null;
}
