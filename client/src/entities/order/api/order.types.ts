export type OrderStatusCode = "NEW" | "CONTACTED" | "DONE" | "CANCELLED"

export interface StorefrontOrderStatusHistoryView {
  id: string
  fromStatusCode: string | null
  toStatusCode: string
  changedById: string
  changedByName?: string
  note: string | null
  changedAt: string
}

export interface StorefrontOrderView {
  id: string
  storeId: string
  storeName: string
  modelId: string
  modelName: string
  productName?: string
  brand: string
  specs: Record<string, string> | null
  customerName: string
  customerPhone: string
  note: string | null
  statusCode: OrderStatusCode
  handledById: string | null
  handledByName: string | null
  handledAt: string | null
  saleId: string | null
  createdAt: string
  updatedAt: string
}

export interface StorefrontOrderDetailView extends StorefrontOrderView {
  history: StorefrontOrderStatusHistoryView[]
}

export interface StorefrontOrderStats {
  new: number
}

export interface StorefrontOrderPage {
  items: StorefrontOrderView[]
  total: number
  page: number
  pageSize: number
}

export interface ListOrdersQuery {
  [key: string]: string | number | boolean | null | undefined
  status?: OrderStatusCode
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

export interface UpdateOrderStatusDto {
  statusCode: OrderStatusCode
  saleId?: string
}
