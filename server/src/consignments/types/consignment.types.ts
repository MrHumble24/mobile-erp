import { Prisma } from '../../generated/client/client.js';

export interface ConsignmentView {
  id: string;
  partnerId: string;
  deviceId: string;
  imei: string;
  agreedPrice: Prisma.Decimal;
  dueDate: Date;
  statusCode: string;
  consignedAt: Date;
  resolvedAt: Date | null;
  notes: string | null;
  createdById: string;
  createdAt: Date;
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
  expectedVersion?: number;
  changedById: string;
}
