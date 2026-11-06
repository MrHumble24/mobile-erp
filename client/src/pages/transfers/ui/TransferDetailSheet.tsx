import { CheckCircle2, XCircle } from "lucide-react"
import {
  StockTransferStatusBadge,
  useCancelStockTransfer,
  useReceiveStockTransfer,
  type StockTransferView,
} from "@/entities/stock-transfer"
import { useAuthStore } from "@/features/auth"
import { useStoreSelectionStore } from "@/features/switch-store"
import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPopup,
  SheetTitle,
} from "@/shared/ui/sheet"
import { toast } from "@/shared/ui/sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

export function TransferDetailSheet({
  transfer,
  open,
  onClose,
}: {
  transfer: StockTransferView | null
  open: boolean
  onClose: () => void
}) {
  const { t } = useI18n()
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const currentStoreId = useStoreSelectionStore((s) => s.currentStoreId)

  const receiveMutation = useReceiveStockTransfer()
  const cancelMutation = useCancelStockTransfer()

  if (!transfer) return null

  const isSent = transfer.status === "SENT"
  const canReceive =
    isSent &&
    currentStoreId === transfer.targetStoreId &&
    hasPermission("transfer.receive")
  const userStoreIds = user?.stores?.map((s) => s.id) ?? []
  const canCancel =
    isSent &&
    userStoreIds.includes(transfer.sourceStoreId) &&
    hasPermission("transfer.create")

  const handleReceive = () => {
    receiveMutation.mutate(transfer.id, {
      onSuccess: () => {
        toast.success(t("transfers.received"))
        onClose()
      },
      onError: (err: { message?: string }) =>
        toast.error(err?.message || t("common.error")),
    })
  }

  const handleCancel = () => {
    if (!window.confirm(t("transfers.confirmCancel"))) return
    cancelMutation.mutate(transfer.id, {
      onSuccess: () => {
        toast.success(t("transfers.cancelled"))
        onClose()
      },
      onError: (err: { message?: string }) =>
        toast.error(err?.message || t("common.error")),
    })
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="font-mono text-base">
              {transfer.transferNumber}
            </SheetTitle>
            <StockTransferStatusBadge status={transfer.status} />
          </div>
          <SheetDescription>
            {transfer.sourceStore.name} → {transfer.targetStore.name}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 my-4">
          <div className="grid grid-cols-2 gap-3 p-3 bg-muted border border-border rounded-[12px] text-xs">
            <div>
              <span className="text-muted-foreground block">
                {t("transfers.sentAt")}:
              </span>
              <span className="font-medium">{formatDate(transfer.sentAt)}</span>
            </div>
            {transfer.receivedAt && (
              <div>
                <span className="text-muted-foreground block">
                  {t("transfers.receivedAt")}:
                </span>
                <span className="font-medium">
                  {formatDate(transfer.receivedAt)}
                </span>
              </div>
            )}
            {transfer.cancelledAt && (
              <div>
                <span className="text-muted-foreground block">
                  {t("transfers.cancelledAt")}:
                </span>
                <span className="font-medium">
                  {formatDate(transfer.cancelledAt)}
                </span>
              </div>
            )}
            {transfer.note && (
              <div className="col-span-2">
                <span className="text-muted-foreground block">
                  {t("common.notes")}:
                </span>
                <span>{transfer.note}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("transfers.lines")} ({transfer.lines.length})
            </h4>
            <div className="border border-border rounded-[10px] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("transfers.item")}</TableHead>
                    <TableHead>{t("transfers.type")}</TableHead>
                    <TableHead className="text-right">
                      {t("transfers.quantity")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfer.lines.map((line) => {
                    const itemLabel =
                      line.lineType === "UNIT"
                        ? `${line.device?.model?.brand ?? ""} ${line.device?.model?.name ?? ""}`.trim()
                        : `${line.model?.brand ?? ""} ${line.model?.name ?? ""}`.trim()
                    const identifier =
                      line.device?.imei ?? line.device?.serialNumber ?? null

                    return (
                      <TableRow key={line.id}>
                        <TableCell className="text-xs">
                          <div className="font-medium">{itemLabel || "—"}</div>
                          {identifier && (
                            <div className="font-mono text-[10px] text-muted-foreground">
                              {identifier}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {line.lineType}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium">
                          {line.lineType === "UNIT"
                            ? "1 ta"
                            : `${line.quantity ?? 1} ta`}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {isSent && (
            <div className="pt-2 flex gap-2 justify-end">
              {canCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-rose-600 hover:text-rose-700"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                >
                  <XCircle className="size-4" />
                  <span>{t("transfers.cancelTransfer")}</span>
                </Button>
              )}
              {canReceive && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleReceive}
                  disabled={receiveMutation.isPending}
                >
                  <CheckCircle2 className="size-4" />
                  <span>{t("transfers.receiveTransfer")}</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetPopup>
    </Sheet>
  )
}
