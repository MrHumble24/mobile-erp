import { Prisma } from '../../generated/client/client.js';

/** Partner directory row with derived balance fields (never stored). */
export interface PartnerView {
  id: string;
  shopName: string;
  contactPerson: string | null;
  phone: string | null;
  telegramHandle: string | null;
  creditLimit: Prisma.Decimal;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  /** sum(agreedPrice where status != RETURNED) − sum(payments). */
  outstanding: Prisma.Decimal;
  /** Consignments currently OUT. */
  openCount: number;
  /** Consignments OUT past their due date. */
  overdueCount: number;
}

/** Just the two numbers the credit-limit rule needs. */
export interface CreditStatus {
  creditLimit: Prisma.Decimal;
  outstanding: Prisma.Decimal;
}

/** Directory filters. `overdue` keeps only partners with an overdue item. */
export interface PartnerFilters {
  search?: string;
  active?: boolean;
  overdue?: boolean;
}

export interface PaymentView {
  id: string;
  partnerId: string;
  consignmentId: string | null;
  amount: Prisma.Decimal;
  paidAt: Date;
  notes: string | null;
  receivedById: string;
  createdAt: Date;
}

/** One chronological ledger line: a consignment charge or a payment credit. */
export interface LedgerEntry {
  at: Date;
  kind: 'consignment' | 'payment';
  refId: string;
  /** Positive = adds to debt (consignment), negative = reduces it (payment). */
  change: Prisma.Decimal;
  runningBalance: Prisma.Decimal;
  statusCode: string | null;
  notes: string | null;
}

export interface CreatePartnerInput {
  shopName: string;
  contactPerson?: string;
  phone?: string;
  telegramHandle?: string;
  creditLimit?: Prisma.Decimal;
  notes?: string;
}

export interface CreatePaymentInput {
  storeId: string;
  partnerId: string;
  consignmentId?: string;
  amount: Prisma.Decimal;
  paidAt?: Date;
  notes?: string;
  receivedById: string;
}
