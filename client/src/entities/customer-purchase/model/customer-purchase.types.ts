/**
 * Buying a used phone from a customer (Change 14, ADR 0039). A second way a unit
 * enters stock. Money is a 2-dp decimal string on reads; `pricePaid` is absent
 * without `device.cost.view`. Dates are ISO strings over HTTP.
 */

export interface PurchaseUnitRef {
  deviceId: string
  imei: string | null
  imei2: string | null
  serialNumber: string | null
  model: { id: string; brand: string; name: string; kindCode: string }
}

export interface CustomerPurchaseView {
  id: string
  customer: { id: string; name: string; phone: string | null }
  unit: PurchaseUnitRef
  /** Redacted (absent) without `device.cost.view`. */
  pricePaid?: string
  /** The account the money left from; null for a trade-in. */
  accountCode: string | null
  /** The sale this was a trade-in on; null for a plain purchase. */
  saleId: string | null
  soldBy: { id: string; name: string }
  occurredAt: string
}

export interface CustomerPurchasePage {
  items: CustomerPurchaseView[]
  total: number
  page: number
  pageSize: number
}

export interface CustomerPurchaseFilters {
  from?: string
  to?: string
  customerId?: string
  /** Matches a unit's IMEI, second IMEI or serial number (exact). */
  search?: string
  page?: number
  pageSize?: number
}

/** `POST /customer-purchases`. Send `customerId` OR inline `customer`; and an
 *  IMEI (+ optional `imei2`) XOR a `serialNumber`, matching the model's kind. */
export interface CreateCustomerPurchaseDto {
  customerId?: string
  customer?: { name: string; phone?: string }
  modelId: string
  imei?: string
  imei2?: string
  serialNumber?: string
  specs?: Record<string, unknown>
  pricePaid: number
  /** The account the money leaves. CASH when omitted. */
  accountCode?: "CASH" | "CARD"
  occurredAt?: string
}
