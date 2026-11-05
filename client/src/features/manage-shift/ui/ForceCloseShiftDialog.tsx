import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { toast } from "@/shared/ui/sonner"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import type { ShiftReport } from "@/entities/shift"
import { useForceCloseShift } from "../model/use-manage-shift"
import { CashCountField } from "./CashCountField"

export interface ForceCloseShiftDialogProps {
  shiftId: string | null
  cashierName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onClosed: (report: ShiftReport) => void
}

function ForceCloseForm({
  shiftId,
  onClosed,
}: {
  shiftId: string
  onClosed: (report: ShiftReport) => void
}) {
  const { t } = useI18n()
  const forceClose = useForceCloseShift()
  const [count, setCount] = React.useState("")
  const [note, setNote] = React.useState("")
  const amount = Number(count)
  const invalid = count.trim() === "" || Number.isNaN(amount) || amount < 0 || note.trim() === ""

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (invalid || forceClose.isPending) return
    forceClose.mutate(
      { id: shiftId, dto: { closingCount: amount, note: note.trim() } },
      {
        onSuccess: (report) => {
          toast.success(t("shifts.shiftClosed"))
          onClosed(report)
        },
        onError: (err: Error) => toast.error(err.message || t("common.error")),
      }
    )
  }

  return (
    <form className="space-y-4 my-2" onSubmit={submit}>
      <CashCountField label={t("shifts.closingCash")} value={count} onChange={setCount} />
      <div className="space-y-1">
        <Label>{t("shifts.note")}</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
      <Button type="submit" className="w-full h-11 font-bold" disabled={invalid || forceClose.isPending}>
        {forceClose.isPending ? t("common.loading") : t("shifts.forceClose")}
      </Button>
    </form>
  )
}

/** Admin closes another cashier's forgotten shift (`shift.manage`); note required. */
export function ForceCloseShiftDialog({
  shiftId,
  cashierName,
  open,
  onOpenChange,
  onClosed,
}: ForceCloseShiftDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("shifts.forceClose")}</DialogTitle>
          <DialogDescription>
            {cashierName ? `${cashierName} — ` : ""}
            {t("shifts.forceCloseHint")}
          </DialogDescription>
        </DialogHeader>
        {open && shiftId && <ForceCloseForm shiftId={shiftId} onClosed={onClosed} />}
      </DialogPopup>
    </Dialog>
  )
}
