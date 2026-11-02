import { Prisma } from '../../generated/client/client.js';

export interface ConsignmentView {
  id: string;
  partnerId: string;
  partnerShopName: string;
  deviceId: string;
  imei: string;
  agreedPrice: Prisma.Decimal;
  dueDate: Date;
  statusCode: string;
  consignedAt: Date;
  resolvedAt: Date | null;
  notes: string | null;
  /** Set once the consignment is SETTLED (the resulting retail sale). */
  saleId: string | null;
  createdById: string;
  createdAt: Date;
}

/** Summary tiles for the consignments screen, honouring the active filter. */
export interface ConsignmentStats {
  total: number;
  openCount: number;
  overdueCount: number;
  /** Σ agreedPrice of OUT consignments in the filtered set. */
  outstanding: Prisma.Decimal;
}

/** Enriched with partner contact for the wave-3 Telegram overdue job. */
export interface OverdueConsignment extends ConsignmentView {
  partnerShopName: string;
  partnerPhone: string | null;
  partnerTelegramHandle: string | null;
}

export interface ConsignmentPage {
  items: ConsignmentView[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ConsignmentFilters {
  partnerId?: string;
  statusCode?: string;
  overdue?: boolean;
  /** Matches device IMEI or partner shop name (case-insensitive). */
  search?: string;
  /** ISO bounds on consignedAt. */
  from?: string;
  to?: string;
}

export interface CreateTransferInput {
  imei: string;
  partnerId: string;
  agreedPrice: Prisma.Decimal;
  dueDate: Date;
  notes?: string;
  clientMutationId?: string;
  expectedVersion?: number;
  createdById: string;
}

export interface SettleInput {
  salePrice?: Prisma.Decimal;
  notes?: string;
  expectedVersion?: number;
  soldById: string;
}

export interface ReturnInput {
  reason?: string;
  /** Device status to restore. Defaults to IN_STOCK. */
  condition?: 'IN_STOCK' | 'DEFECTIVE';
  expectedVersion?: number;
  changedById: string;
}
