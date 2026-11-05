import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { useOpenShift } from "../model/use-manage-shift"
import { CashCountField } from "./CashCountField"

export interface OpenShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function OpenShiftForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n()
  const openShift = useOpenShift()
  const [count, setCount] = React.useState("")
  const amount = Number(count)
  const invalid = count.trim() === "" || Number.isNaN(amount) || amount < 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (invalid || openShift.isPending) return
    openShift.mutate(
      { openingCount: amount },
      {
        onSuccess: () => {
          toast.success(t("shifts.shiftOpened"))
          onDone()
        },
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )
  }

  return (
    <form className="space-y-4 my-2" onSubmit={submit}>
      <CashCountField label={t("shifts.openingCash")} value={count} onChange={setCount} />
      <Button type="submit" className="w-full h-11 font-bold" disabled={invalid || openShift.isPending}>
        {openShift.isPending ? t("common.loading") : t("shifts.openShift")}
      </Button>
    </form>
  )
}

/** Open a shift: the cashier types the cash counted in the drawer at the start. */
export function OpenShiftDialog({ open, onOpenChange }: OpenShiftDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("shifts.openShift")}</DialogTitle>
          <DialogDescription>{t("shifts.openingCash")}</DialogDescription>
        </DialogHeader>
        {open && <OpenShiftForm onDone={() => onOpenChange(false)} />}
      </DialogPopup>
    </Dialog>
  )
}
