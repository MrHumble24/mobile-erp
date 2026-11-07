import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useChangeRepairStatus, repairMutationError } from "@/entities/repair"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { toast } from "@/shared/ui/sonner"

export interface StatusMoveDialogProps {
  repairId: string
  /** Human ticket number shown instead of a UUID fragment. */
  ticketNumber?: number
  toStatusCode: string
  title: string
  reasonLabel: string
  /** Shown above the field when a reason is required (e.g. an owed hand-over). */
  warning?: string
  reasonRequired: boolean
  confirmLabel: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StatusMoveBody(props: StatusMoveDialogProps) {
  const { repairId, toStatusCode, reasonLabel, warning, reasonRequired, confirmLabel, onOpenChange } = props
  const { t } = useI18n()
  const change = useChangeRepairStatus(repairId)
  const [note, setNote] = React.useState("")
  const invalid = reasonRequired && !note.trim()

  const submit = () =>
    change.mutate(
      { toStatusCode, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(t("repairs.statusChanged"))
          onOpenChange(false)
        },
        onError: (err: Error) => {
          const { message, queued } = repairMutationError(err, t)
          if (queued) toast.success(message)
          else toast.error(message)
        },
      }
    )

  return (
    <div className="space-y-3 my-2">
      {warning && (
        <p className="flex items-start gap-1.5 rounded-[10px] bg-amber-500/10 p-2.5 text-xs text-amber-700">
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          {warning}
        </p>
      )}
      <div className="space-y-1">
        <Label>{reasonLabel}</Label>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
      </div>
      <Button className="w-full" disabled={invalid || change.isPending} onClick={submit}>
        {change.isPending ? t("common.loading") : confirmLabel}
      </Button>
    </div>
  )
}

/** A status move that needs a note: cancelling, or an owed hand-over. The body
 *  mounts fresh on open, so the note always starts empty. */
export function StatusMoveDialog(props: StatusMoveDialogProps) {
  const { t } = useI18n()
  const { title, ticketNumber, open, onOpenChange } = props
  const label = ticketNumber != null ? `#${ticketNumber}` : t("repairs.ticketLabel")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{label}</DialogDescription>
        </DialogHeader>
        {open && <StatusMoveBody {...props} />}
      </DialogPopup>
    </Dialog>
  )
}
