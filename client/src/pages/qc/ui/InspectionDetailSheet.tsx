import { ExternalLink } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime, formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import type { LookupView, QcInspectionListItem } from "@/entities/qc"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Badge } from "@/shared/ui/badge"
import { Link } from "@/shared/ui/link"
import { buttonVariants } from "@/shared/ui/button"

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-2 min-w-0 text-sm">
      <span className="text-muted-foreground min-w-0 truncate">{label}:</span>
      <span className="font-medium shrink-0 whitespace-nowrap tabular-nums">{value}</span>
    </div>
  )
}

function DefectList({ item, labels }: { item: QcInspectionListItem; labels: Map<string, string> }) {
  if (item.defects.length === 0) return <p className="text-sm text-muted-foreground">-</p>
  return (
    <div className="space-y-2">
      {item.defects.map((d) => (
        <div key={d.defectCode} className="border border-border rounded-[12px] bg-muted p-2.5">
          <p className="text-sm font-medium">{labels.get(d.defectCode) ?? d.defectCode}</p>
          {d.notes && <p className="text-xs text-muted-foreground mt-0.5">{d.notes}</p>}
        </div>
      ))}
    </div>
  )
}

function Body({ item, defectTypes }: { item: QcInspectionListItem; defectTypes: LookupView[] }) {
  const { t } = useI18n()
  const labels = new Map(defectTypes.map((d) => [d.code, d.label]))
  return (
    <div className="space-y-5 my-4">
      <div className="space-y-1.5 border border-border rounded-[14px] bg-muted p-3.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-medium">{unitCode(item.device)}</span>
          <Badge variant={item.passed ? "mint" : "destructive"} size="sm">
            {item.passed ? t("qc.passed") : t("qc.failed")}
          </Badge>
        </div>
        <p className="text-sm font-semibold">{item.device.model.brand} {item.device.model.name}</p>
      </div>
      <div className="space-y-1.5">
        <Row label={t("common.date")} value={formatDateTime(item.inspectedAt)} />
        <Row label={t("qc.inspector")} value={item.inspectedBy.name || "-"} />
        <Row label={t("qc.grade")} value={item.gradeCode || "-"} />
        <Row label={t("qc.batteryHealth")} value={item.batteryHealth != null ? `${item.batteryHealth}%` : "-"} />
        {item.repairCostEstimate != null && (
          <Row label={t("qc.repairCost")} value={formatMoney(item.repairCostEstimate)} />
        )}
      </div>
      {item.notes && <p className="text-sm text-muted-foreground italic">"{item.notes}"</p>}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t("qc.defects")}</h4>
        <DefectList item={item} labels={labels} />
      </div>
      <Link to={`/inventory?imei=${unitCode(item.device)}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
        <ExternalLink className="size-4" />
        {t("qc.openInInventory")}
      </Link>
    </div>
  )
}

export function InspectionDetailSheet({
  item,
  open,
  onClose,
  defectTypes,
}: {
  item: QcInspectionListItem | null
  open: boolean
  onClose: () => void
  defectTypes: LookupView[]
}) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{t("qc.inspectionDetails")}</SheetTitle>
          <SheetDescription>{item ? formatDateTime(item.inspectedAt) : ""}</SheetDescription>
        </SheetHeader>
        {item && <Body item={item} defectTypes={defectTypes} />}
      </SheetPopup>
    </Sheet>
  )
}
