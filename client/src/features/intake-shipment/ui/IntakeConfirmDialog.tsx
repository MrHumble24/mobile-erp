import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog"

export interface IntakeConfirmDialogProps {
  open: boolean
  modelLabel: string
  imei: string
  imei2: string | null
  cost: number
  /** Add-time error (duplicate IMEI); when set, only Cancel is offered. */
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

/** Verify a scanned unit (model + IMEIs + cost) before it joins the batch. */
export function IntakeConfirmDialog({
  open,
  modelLabel,
  imei,
  imei2,
  cost,
  error,
  onConfirm,
  onCancel,
}: IntakeConfirmDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{modelLabel}</DialogTitle>
          <DialogDescription>{t("shipments.acquisitionCost")}: {cost}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="font-mono text-lg tracking-wide text-[#090c1d]">{imei}</p>
          {imei2 && (
            <p className="font-mono text-sm tracking-wide text-[#646464]">
              {t("inventory.imei2")}: {imei2}
            </p>
          )}
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          {!error && (
            <Button type="button" onClick={onConfirm}>
              {t("common.add")}
            </Button>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
