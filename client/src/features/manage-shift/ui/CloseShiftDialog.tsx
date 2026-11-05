import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { toast } from "@/shared/ui/sonner"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import {
  useCurrentShift,
  shiftDifference,
  differenceKind,
  type ShiftReport,
} from "@/entities/shift"
import { useCloseShift } from "../model/use-manage-shift"
import { CashCountField } from "./CashCountField"

export interface CloseShiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with the closed report so the caller can show it + print. */
  onClosed: (report: ShiftReport) => void
}

function InfoRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-bold ${tone ?? ""}`}>{value}</span>
    </div>
  )
}

function DifferenceRow({ expected, counted }: { expected: string; counted: string }) {
  const { t } = useI18n()
  const diff = shiftDifference(counted, expected)
  const kind = differenceKind(diff)
  const tone =
    kind === "short" ? "text-[#d92d20]" : kind === "over" ? "text-[#027a48]" : "text-muted-foreground"
  const label =
    kind === "short" ? t("shifts.shortage") : kind === "over" ? t("shifts.surplus") : t("shifts.noDifference")
  return <InfoRow label={label} value={formatMoney(diff)} tone={tone} />
}

function CloseShiftForm({ onClosed }: { onClosed: (report: ShiftReport) => void }) {
  const { t } = useI18n()
  const { data: current } = useCurrentShift(true)
  const close = useCloseShift()
  const [count, setCount] = React.useState("")
  const [note, setNote] = React.useState("")

  const expected = current?.expectedCash ?? "0.00"
  const amount = Number(count)
  const invalid = count.trim() === "" || Number.isNaN(amount) || amount < 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (invalid || close.isPending) return
    close.mutate(
      { closingCount: amount, note: note.trim() || undefined },
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
      <InfoRow label={t("shifts.expectedCash")} value={formatMoney(expected)} />
      <CashCountField label={t("shifts.closingCash")} value={count} onChange={setCount} />
      {!invalid && <DifferenceRow expected={expected} counted={count} />}
      <div className="space-y-1">
        <Label>{t("shifts.note")}</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
      </div>
      <Button type="submit" className="w-full h-11 font-bold" disabled={invalid || close.isPending}>
        {close.isPending ? t("common.loading") : t("shifts.closeShift")}
      </Button>
    </form>
  )
}

/** Close my shift: shows the live expected cash, the cashier counts, sees the
 *  difference before confirming, adds an optional note. */
export function CloseShiftDialog({ open, onOpenChange, onClosed }: CloseShiftDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("shifts.closeShift")}</DialogTitle>
          <DialogDescription>{t("shifts.differenceHint")}</DialogDescription>
        </DialogHeader>
        {open && <CloseShiftForm onClosed={onClosed} />}
      </DialogPopup>
    </Dialog>
  )
}
