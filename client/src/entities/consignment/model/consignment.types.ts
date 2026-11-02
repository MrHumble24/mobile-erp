export interface ConsignmentView {
  id: string
  partnerId: string
  partnerShopName: string
  deviceId: string
  imei: string
  agreedPrice: string
  dueDate: string
  statusCode: "OUT" | "SETTLED" | "RETURNED" | string
  consignedAt: string
  resolvedAt: string | null
  notes: string | null
  saleId: string | null
  createdById: string
  createdAt: string
}

export interface ConsignmentStats {
  total: number
  openCount: number
  overdueCount: number
  outstanding: string
}

export interface OverdueConsignment extends ConsignmentView {
  partnerShopName: string
  partnerPhone: string | null
  partnerTelegramHandle: string | null
}

export interface ConsignmentPage {
  items: ConsignmentView[]
  total: number
  page: number
  pageSize: number
}

export interface ConsignmentFilters {
  partnerId?: string
  statusCode?: string
  overdue?: boolean
  search?: string
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface CreateConsignmentDto {
  imei: string
  partnerId: string
  agreedPrice: number
  dueDate: string
  notes?: string
  clientMutationId?: string
  expectedVersion?: number
}

export interface SettleConsignmentDto {
  salePrice?: number
  notes?: string
  expectedVersion?: number
}

export interface ReturnConsignmentDto {
  reason?: string
  condition?: "IN_STOCK" | "DEFECTIVE"
  expectedVersion?: number
}
