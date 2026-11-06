import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import type { QcInspectionListItem } from "@/entities/qc"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"

function ResultBadge({ passed }: { passed: boolean }) {
  const { t } = useI18n()
  return (
    <Badge variant={passed ? "mint" : "destructive"} size="sm">
      {passed ? t("qc.passed") : t("qc.failed")}
    </Badge>
  )
}

function InspectionsHead({ canViewCost }: { canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{t("common.date")}</TableHead>
        <TableHead>{t("catalog.unitCode")}</TableHead>
        <TableHead>{t("inventory.model")}</TableHead>
        <TableHead>{t("qc.inspector")}</TableHead>
        <TableHead>{t("qc.result")}</TableHead>
        <TableHead>{t("qc.grade")}</TableHead>
        <TableHead className="text-center">{t("qc.battery")}</TableHead>
        <TableHead className="text-center">{t("qc.defectCount")}</TableHead>
        {canViewCost && <TableHead>{t("qc.repairCost")}</TableHead>}
      </TableRow>
    </TableHeader>
  )
}

export function InspectionsTable({
  items,
  canViewCost,
  onSelect,
}: {
  items: QcInspectionListItem[]
  canViewCost: boolean
  onSelect: (item: QcInspectionListItem) => void
}) {
  const { t } = useI18n()
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border border-border rounded-[16px] bg-card shadow-[var(--shadow-xs)]">
        {t("common.notFound")}
      </div>
    )
  }
  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <InspectionsHead canViewCost={canViewCost} />
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => onSelect(item)}>
              <TableCell className="text-muted-foreground text-xs">{formatDate(item.inspectedAt)}</TableCell>
              <TableCell className="font-mono font-medium">{unitCode(item.device)}</TableCell>
              <TableCell className="font-medium">{item.device.model.brand} {item.device.model.name}</TableCell>
              <TableCell>{item.inspectedBy.name || "-"}</TableCell>
              <TableCell><ResultBadge passed={item.passed} /></TableCell>
              <TableCell>{item.gradeCode || "-"}</TableCell>
              <TableCell className="text-center">{item.batteryHealth != null ? `${item.batteryHealth}%` : "-"}</TableCell>
              <TableCell className="text-center">{item.defects.length}</TableCell>
              {canViewCost && <TableCell className="text-muted-foreground">{formatMoney(item.repairCostEstimate)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
