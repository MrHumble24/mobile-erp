import { downloadCsv } from "@/shared/lib/csv"
import type { CustomerListItem } from "@/entities/customer"

/** Export the current filtered page of customers with their purchase aggregates. */
export function exportCustomersCsv(customers: CustomerListItem[]): void {
  const headers = [
    "Name",
    "Phone",
    "Purchases",
    "Total Spent",
    "Last Purchase",
    "Active Warranties",
    "Returns",
    "Created",
  ]
  const rows = customers.map((c) => [
    c.name,
    c.phone ?? "",
    c.purchaseCount,
    c.totalSpent,
    c.lastPurchaseAt ? c.lastPurchaseAt.slice(0, 10) : "",
    c.activeWarranties,
    c.returnsCount,
    c.createdAt.slice(0, 10),
  ])
  downloadCsv(`customers-${new Date().toISOString().slice(0, 10)}`, headers, rows)
}
