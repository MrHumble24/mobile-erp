import { downloadCsv } from "@/shared/lib/csv"
import { saleUnitCode } from "@/shared/lib/sale-subject"
import type { SaleView } from "@/entities/sale"

/**
 * Export the current filtered page of sales. Cost/profit columns are included
 * only when the caller may view them.
 */
export function exportSalesCsv(sales: SaleView[], includeProfit: boolean): void {
  const headers = [
    "Brand",
    "Model",
    "IMEI",
    "Channel",
    "Customer",
    "Phone",
    "Sale Price",
    ...(includeProfit ? ["Net Profit"] : []),
    "Cashier",
    "Sold At",
    "Status",
  ]
  const rows = sales.map((s) => [
    s.device?.model.brand ?? s.model?.brand ?? "",
    s.device?.model.name ?? s.model?.name ?? "",
    saleUnitCode(s) ?? `×${s.quantity ?? ""}`,
    s.consignmentId ? "B2B" : "Retail",
    s.customer?.name ?? "",
    s.customer?.phone ?? "",
    s.salePrice,
    ...(includeProfit ? [s.netProfit ?? ""] : []),
    s.soldBy?.name ?? "",
    s.soldAt,
    s.return ? "Returned" : "Sold",
  ])
  downloadCsv(`sales-${new Date().toISOString().slice(0, 10)}`, headers, rows)
}
