import { downloadCsv } from "@/shared/lib/csv"
import { unitCode } from "@/shared/lib/unit-code"
import type { ConsignmentView } from "@/entities/consignment"
import { daysOverdue } from "./overdue"

type Translate = (key: string) => string

/** Exports the current consignment list page as CSV (no cost fields). */
export function exportConsignmentsCsv(items: ConsignmentView[], t: Translate): void {
  const headers = [
    t("consignments.partner"),
    t("consignments.device"),
    t("consignments.agreedPrice"),
    t("consignments.dueDate"),
    t("common.status"),
    t("consignments.daysOverdue"),
  ]
  const rows = items.map((c) => [
    c.partnerShopName,
    unitCode(c),
    Number(c.agreedPrice),
    c.dueDate.slice(0, 10),
    c.statusCode,
    daysOverdue(c.dueDate, c.statusCode),
  ])
  downloadCsv("consignments", headers, rows)
}
