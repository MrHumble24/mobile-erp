/**
 * Repair tickets (Change 13, ADR 0040). All money is a 2-dp decimal string on
 * reads; writes send positive numbers. Dates are ISO strings over HTTP. Cost
 * figures (partUnitCost, partLineCost, partsCost, outsideCost, outsidePaid,
 * profit) are null for a caller without `device.cost.view`; never render them.
 * Nothing derivable (paid, outstanding, warranty) is stored server-side.
 */
import type { RepairStatusCode } from "../lib/repair-status"

export type { RepairStatusCode }

/** Who repairs the phone: the shop's own master, or an outside one. */
export type RepairMasterView =
  | { kind: "OWN"; userId: string; name: string }
  | { kind: "OUTSIDE"; name: string; phone: string | null }
  | null

export interface RepairPartView {
  id: string
  modelId: string
  name: string
  quantity: number
  partUnitCost: string | null
  partLineCost: string | null
  addedBy: { id: string; name: string }
  createdAt: string
}

export interface RepairPaymentView {
  id: string
  accountCode: string
  /** Signed: positive = payment in, negative = refund out. */
  amount: string
  occurredAt: string
  receivedBy: { id: string; name: string }
}

export interface RepairStatusHistoryView {
  fromStatusCode: string | null
  toStatusCode: string
  note: string | null
  changedBy: { id: string; name: string }
  changedAt: string
}

export interface RepairView {
  id: string
  ticketNumber: number
  customer: { id: string; name: string; phone: string | null }
  deviceName: string
  modelId: string | null
  model: string | null
  imei: string | null
  serialNumber: string | null
  problem: string
  agreedPrice: string
  warrantyDays: number
  notes: string | null
  master: RepairMasterView
  outsideCost: string | null
  statusCode: string
  statusLabel: string
  isTerminal: boolean
  receivedBy: { id: string; name: string }
  receivedAt: string
  createdAt: string
  updatedAt: string
  parts: RepairPartView[]
  payments: RepairPaymentView[]
  statusHistory: RepairStatusHistoryView[]
  paid: string
  outstanding: string
  partsCost: string | null
  outsidePaid: string | null
  profit: string | null
  givenBackAt: string | null
  warrantyUntil: string | null
  underWarranty: boolean
}

export interface RepairListItem {
  id: string
  ticketNumber: number
  customer: { id: string; name: string; phone: string | null }
  deviceName: string
  imei: string | null
  statusCode: string
  statusLabel: string
  isTerminal: boolean
  agreedPrice: string
  paid: string
  outstanding: string
  receivedAt: string
  warrantyUntil: string | null
  underWarranty: boolean
}

export interface RepairPage {
  items: RepairListItem[]
  total: number
  page: number
  pageSize: number
}

export interface RepairReport {
  from: string | null
  to: string | null
  income: string
  partsCost: string | null
  outsideCost: string | null
  profit: string | null
}

/** Inline customer when no existing id is given: upserted by phone. */
export interface RepairCustomerDto {
  name: string
  phone?: string
}

export interface CreateRepairDto {
  customerId?: string
  customer?: RepairCustomerDto
  deviceName: string
  modelId?: string
  imei?: string
  serialNumber?: string
  problem: string
  agreedPrice: number
  warrantyDays: number
  notes?: string
  masterUserId?: string
  outsideMasterName?: string
  outsideMasterPhone?: string
  outsideCost?: number
  receivedAt?: string
}

export interface UpdateRepairDto {
  deviceName?: string
  modelId?: string
  imei?: string
  serialNumber?: string
  problem?: string
  agreedPrice?: number
  warrantyDays?: number
  notes?: string
  masterUserId?: string
  outsideMasterName?: string
  outsideMasterPhone?: string
  outsideCost?: number
}

export interface ChangeStatusDto {
  toStatusCode: string
  note?: string
}

export interface AddPartDto {
  modelId: string
  quantity: number
}

export interface RepairMoneyDto {
  amount: number
  accountCode: string
}

export interface RepairListFilters {
  status?: RepairStatusCode
  from?: string
  to?: string
  customerId?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface RepairReportFilters {
  from?: string
  to?: string
}
