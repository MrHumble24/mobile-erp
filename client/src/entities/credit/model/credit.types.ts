/**
 * Customer credit, no interest (ADR 0035). All money is a 2-dp decimal string on
 * reads; writes send positive numbers. Dates are ISO strings over HTTP. Nothing
 * derivable (agreedTotal, paid, outstanding, overdue) is stored server-side.
 */

export type CreditStatus = "open" | "overdue" | "settled"

/** One cart line — exactly what POST /sales takes for a single sale. */
export interface CreditLineDto {
  imei?: string
  serialNumber?: string
  modelId?: string
  quantity?: number
  salePrice: number
  priceLevelCode?: string
  discount?: { mode: "PERCENT" | "AMOUNT"; value: number }
  warrantyDays?: number
  notes?: string
}

/** One planned part: an amount due by a date. No interest/fee fields exist. */
export interface CreditInstalmentDto {
  dueDate: string
  amount: number
}

/** A down payment / later payment tender line: cash or card. */
export interface CreditTenderDto {
  accountCode: string
  amount: number
}

export interface CreateCreditDto {
  customerId: string
  lines: CreditLineDto[]
  /** Down payment taken now (cash/card/split). May be empty. */
  payments?: CreditTenderDto[]
  instalments: CreditInstalmentDto[]
  note?: string
  /** Idempotency key from the till. */
  clientKey?: string
}

/** A later payment on a credit, or an overpayment refund. */
export interface CreditPaymentDto {
  amount: number
  accountCode: string
}

export interface CreditSaleView {
  saleId: string
  imei: string | null
  serialNumber: string | null
  model: string
  quantity: number | null
  salePrice: string
  returnedAt: string | null
}

export interface CreditInstalmentView {
  id: string
  dueDate: string
  amount: string
  paid: string
  overdue: boolean
}

export interface CreditPaymentView {
  id: string
  accountCode: string
  amount: string
  occurredAt: string
  receivedBy: { id: string; name: string }
}

export interface CreditView {
  id: string
  customer: { id: string; name: string; phone: string | null }
  createdBy: { id: string; name: string }
  note: string | null
  createdAt: string
  sales: CreditSaleView[]
  instalments: CreditInstalmentView[]
  payments: CreditPaymentView[]
  agreedTotal: string
  paid: string
  outstanding: string
  overpaid: string
  overdueAmount: string
  settled: boolean
}

export interface CreditListItem {
  id: string
  customer: { id: string; name: string; phone: string | null }
  createdAt: string
  agreedTotal: string
  paid: string
  outstanding: string
  overdueAmount: string
  settled: boolean
}

export interface CreditReport {
  totalOutstanding: string
  totalOverdue: string
  customers: {
    customerId: string
    name: string
    phone: string | null
    outstanding: string
    overdueAmount: string
  }[]
}

/** Everything a client needs to print the paper contract. */
export interface CreditContract {
  creditId: string
  createdAt: string
  store: { name: string | null; address: string | null; phone: string | null }
  customer: { name: string; phone: string | null }
  goods: {
    description: string
    imei: string | null
    serialNumber: string | null
    quantity: number | null
    price: string
  }[]
  agreedTotal: string
  downPayment: string
  instalments: { dueDate: string; amount: string }[]
  /** The plain Islamic-finance statement: no interest, no late fee ever. */
  terms: string
}

export interface CreditListFilters {
  customerId?: string
  status?: CreditStatus
}
