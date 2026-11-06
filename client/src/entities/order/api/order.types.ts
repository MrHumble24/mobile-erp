export type OrderStatusCode = "NEW" | "CONTACTED" | "SHIPPED" | "DONE" | "CANCELLED"

export interface StorefrontOrderStatusHistoryView {
  id: string
  fromStatusCode: string | null
  toStatusCode: string
  changedById?: string
  changedByName?: string | null
  note: string | null
  changedAt: string
}

export interface StorefrontOrderPaymentView {
  id: string
  providerCode: string
  providerLabel: string
  statusCode: string
  statusLabel: string
  amount: string
  paidAt: string | null
  cancelledAt: string | null
  refundedAt: string | null
  createdAt: string
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
  fulfillmentMethodCode: string
  fulfillmentMethodLabel?: string
  address?: string | null
  deliveryZoneId?: string | null
  deliveryZoneName?: string | null
  paymentMethodCode: string
  paymentMethodLabel?: string
  priceSnapshot?: string | null
  deliveryFeeSnapshot?: string
  deviceId?: string | null
  statusCode: OrderStatusCode
  statusLabel?: string
  handledById?: string | null
  handledByName: string | null
  handledAt: string | null
  saleId: string | null
  payment?: StorefrontOrderPaymentView | null
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

export interface HandOverPaymentItem {
  accountCode: string
  amount: number
}

export interface HandOverOrderDto {
  payments?: HandOverPaymentItem[]
  deliveryFeeAccountCode?: string
}
