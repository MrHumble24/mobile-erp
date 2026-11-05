import * as React from "react"
import { useNavigate } from "react-router"
import { Pencil, Printer } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useRepair, RepairStatusBadge, type RepairView } from "@/entities/repair"
import { EditRepairDialog } from "@/features/repair-ticket"
import { RepairStatusActions } from "@/features/repair-status"
import { RepairPartsManager } from "@/features/repair-parts"
import { RepairMoneyActions } from "@/features/repair-payment"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { RepairMoneySummary, RepairMeta, RepairWarranty } from "./RepairDetailSections"
import { RepairPaymentsList, RepairHistory } from "./RepairDetailActivity"

function DetailHeader({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const canManage = useAuthStore((s) => s.hasPermission("repair.manage"))
  const [editOpen, setEditOpen] = React.useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-lg font-semibold">
            #{repair.ticketNumber} · {repair.customer.name}
          </div>
          <div className="font-mono text-sm text-muted-foreground">{repair.customer.phone || "—"}</div>
        </div>
        <RepairStatusBadge statusCode={repair.statusCode} statusLabel={repair.statusLabel} />
      </div>
      <div className="flex flex-wrap gap-2">
        {canManage && !repair.isTerminal && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="size-3.5" />
            {t("repairs.editTicket")}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => navigate(`/repairs/${repair.id}/ticket`)}
        >
          <Printer className="size-3.5" />
          {t("repairs.printTicket")}
        </Button>
      </div>
      <RepairStatusActions repair={repair} />
      <RepairMoneyActions repair={repair} />
      <EditRepairDialog repair={repair} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}

function DetailBody({ repairId }: { repairId: string }) {
  const { data: repair, isLoading } = useRepair(repairId)
  if (isLoading || !repair) return <Skeleton className="h-64 rounded-[14px]" />
  return (
    <div className="space-y-6">
      <DetailHeader repair={repair} />
      <RepairMoneySummary repair={repair} />
      <RepairMeta repair={repair} />
      <RepairPartsManager repair={repair} />
      <RepairPaymentsList repair={repair} />
      <RepairWarranty repair={repair} />
      <RepairHistory repair={repair} />
    </div>
  )
}

export function RepairDetailSheet({
  repairId,
  open,
  onOpenChange,
}: {
  repairId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetPopup side="right" className="space-y-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("repairs.detailTitle")}</SheetTitle>
          <SheetDescription>{t("repairs.pageDescription")}</SheetDescription>
        </SheetHeader>
        {repairId && <DetailBody repairId={repairId} />}
      </SheetPopup>
    </Sheet>
  )
}
