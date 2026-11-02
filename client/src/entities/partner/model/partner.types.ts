export interface PartnerView {
  id: string
  shopName: string
  contactPerson: string | null
  phone: string | null
  telegramHandle: string | null
  creditLimit: string
  notes: string | null
  isActive: boolean
  createdAt: string
  outstanding: string
  openCount: number
  overdueCount: number
}

export interface LedgerEntry {
  at: string
  kind: "consignment" | "payment"
  refId: string
  change: string
  runningBalance: string
  statusCode: string | null
  notes: string | null
}

export interface CreatePartnerDto {
  shopName: string
  contactPerson?: string
  phone?: string
  telegramHandle?: string
  creditLimit?: number
  notes?: string
}

export interface UpdatePartnerDto {
  shopName?: string
  contactPerson?: string
  phone?: string
  telegramHandle?: string
  creditLimit?: number
  notes?: string
  isActive?: boolean
}

export interface RecordPaymentDto {
  amount: number
  consignmentId?: string
  paidAt?: string
  notes?: string
}
