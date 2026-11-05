import * as React from "react"
import { useI18n } from "@/shared/i18n"
import {
  allowedMoves,
  isOwed,
  useChangeRepairStatus,
  repairErrorKey,
  type RepairView,
} from "@/entities/repair"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import { StatusMoveDialog } from "./StatusMoveDialog"

type NoteMove = "CANCELLED" | "GIVEN_BACK"

const MOVE_LABEL: Record<string, string> = {
  IN_REPAIR: "repairs.moveInRepair",
  READY: "repairs.moveReady",
  RECEIVED: "repairs.moveReceived",
  GIVEN_BACK: "repairs.moveGivenBack",
  CANCELLED: "repairs.moveCancelled",
}

function moveVariant(code: string): "default" | "outline" | "destructive" {
  if (code === "CANCELLED") return "destructive"
  if (code === "GIVEN_BACK") return "default"
  return "outline"
}

function NoteDialogs({
  repairId,
  dialog,
  onClose,
}: {
  repairId: string
  dialog: NoteMove | null
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <>
      <StatusMoveDialog
        repairId={repairId}
        toStatusCode="CANCELLED"
        title={t("repairs.cancelTitle")}
        reasonLabel={t("repairs.cancelReason")}
        warning={t("repairs.cancelHint")}
        reasonRequired
        confirmLabel={t("repairs.moveCancelled")}
        open={dialog === "CANCELLED"}
        onOpenChange={(o) => !o && onClose()}
      />
      <StatusMoveDialog
        repairId={repairId}
        toStatusCode="GIVEN_BACK"
        title={t("repairs.giveBackTitle")}
        reasonLabel={t("repairs.giveBackReason")}
        warning={t("repairs.giveBackOwedWarning")}
        reasonRequired
        confirmLabel={t("repairs.confirmGiveBack")}
        open={dialog === "GIVEN_BACK"}
        onOpenChange={(o) => !o && onClose()}
      />
    </>
  )
}

/** The legal next-status buttons (`repair.manage`). Cancelling and an owed
 *  hand-over open a reason dialog; other moves post directly. */
export function RepairStatusActions({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const change = useChangeRepairStatus(repair.id)
  const [dialog, setDialog] = React.useState<NoteMove | null>(null)
  const moves = allowedMoves(repair.statusCode)
  const owed = isOwed(repair.agreedPrice, repair.paid)

  const onMove = (code: string) => {
    if (code === "CANCELLED") return setDialog("CANCELLED")
    if (code === "GIVEN_BACK" && owed) return setDialog("GIVEN_BACK")
    change.mutate(
      { toStatusCode: code },
      {
        onSuccess: () => toast.success(t("repairs.statusChanged")),
        onError: (err: Error) => {
          const key = repairErrorKey(err)
          toast.error(key ? t(key) : err.message || t("common.error"))
        },
      }
    )
  }

  if (moves.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {moves.map((code) => (
        <Button key={code} size="sm" variant={moveVariant(code)} disabled={change.isPending} onClick={() => onMove(code)}>
          {t(MOVE_LABEL[code] ?? code)}
        </Button>
      ))}
      <NoteDialogs repairId={repair.id} dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  )
}
