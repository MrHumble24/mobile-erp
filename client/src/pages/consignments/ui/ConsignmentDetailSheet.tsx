import * as React from "react"
import { CheckCircle2, ExternalLink, RotateCcw, Smartphone, Store } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate, formatDateTime } from "@/shared/lib/format"
import { useConsignment, type ConsignmentView } from "@/entities/consignment"
import { unitCode } from "@/shared/lib/unit-code"
import { DeviceDrawer } from "@/widgets/device-drawer"
import { Badge } from "@/shared/ui/badge"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { Skeleton } from "@/shared/ui/skeleton"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { daysOverdue } from "../lib/overdue"

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0 py-1.5 text-sm">
      <span className="text-muted-foreground min-w-0 truncate">{label}</span>
      <span className="font-medium shrink-0 whitespace-nowrap tabular-nums">{value}</span>
    </div>
  )
}

function DetailBody({
  consignment,
  onSettle,
  onReturn,
}: {
  consignment: ConsignmentView
  onSettle: (c: ConsignmentView) => void
  onReturn: (c: ConsignmentView) => void
}) {
  const { t } = useI18n()
  const [deviceOpen, setDeviceOpen] = React.useState(false)
  const overdue = daysOverdue(consignment.dueDate, consignment.statusCode)

  return (
    <div className="my-4 space-y-5 overflow-y-auto">
      <div className="rounded-[14px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
        <Row
          label={t("consignments.partner")}
          value={
            <Link
              to={`/partners?q=${encodeURIComponent(consignment.partnerShopName)}`}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Store className="size-3.5" />
              {consignment.partnerShopName}
            </Link>
          }
        />
        <Row
          label={t("consignments.device")}
          value={
            <span className="font-mono">
              {unitCode(consignment)}
              {consignment.imei2 && (
                <span className="block text-xs text-muted-foreground">IMEI 2: {consignment.imei2}</span>
              )}
            </span>
          }
        />
        <Row label={t("consignments.agreedPrice")} value={formatMoney(consignment.agreedPrice)} />
        <Row
          label={t("consignments.dueDate")}
          value={
            <span className={overdue > 0 ? "font-semibold text-destructive" : ""}>
              {formatDate(consignment.dueDate)}
              {overdue > 0 && ` · ${overdue} ${t("consignments.daysOverdue")}`}
            </span>
          }
        />
        <Row label={t("consignments.consignedAt")} value={formatDateTime(consignment.consignedAt)} />
        {consignment.resolvedAt && (
          <Row label={t("consignments.resolvedAt")} value={formatDateTime(consignment.resolvedAt)} />
        )}
        {consignment.notes && <Row label={t("common.notes")} value={consignment.notes} />}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setDeviceOpen(true)}>
          <Smartphone className="size-4" /> {t("consignments.openDevice")}
        </Button>
        {consignment.saleId && (
          <Link to={`/sales/${consignment.saleId}/receipt`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink className="size-4" /> {t("consignments.resultingSale")}
          </Link>
        )}
        {consignment.statusCode === "OUT" && (
          <>
            <Button size="sm" className="gap-1.5" onClick={() => onSettle(consignment)}>
              <CheckCircle2 className="size-4" /> {t("consignments.settle")}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => onReturn(consignment)}
            >
              <RotateCcw className="size-4" /> {t("consignments.return")}
            </Button>
          </>
        )}
      </div>

      <DeviceDrawer imei={unitCode(consignment)} open={deviceOpen} onClose={() => setDeviceOpen(false)} />
    </div>
  )
}

export function ConsignmentDetailSheet({
  consignmentId,
  open,
  onClose,
  onSettle,
  onReturn,
}: {
  consignmentId: string | null
  open: boolean
  onClose: () => void
  onSettle: (c: ConsignmentView) => void
  onReturn: (c: ConsignmentView) => void
}) {
  const { t } = useI18n()
  const { data, isLoading } = useConsignment(open && consignmentId ? consignmentId : "")

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("consignments.detailTitle")}</SheetTitle>
          <SheetDescription>
            {data ? <Badge variant="outline">{data.statusCode}</Badge> : ""}
          </SheetDescription>
        </SheetHeader>
        {isLoading && <Skeleton className="my-4 h-64 rounded-[16px]" />}
        {data && <DetailBody consignment={data} onSettle={onSettle} onReturn={onReturn} />}
      </SheetPopup>
    </Sheet>
  )
}
