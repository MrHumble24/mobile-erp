import * as React from "react"
import { useI18n } from "@/shared/i18n"
import {
  allowedMoves,
  useChangeRepairStatus,
  repairMutationError,
  type RepairView,
} from "@/entities/repair"
import { useAuthStore } from "@/features/auth"
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
  ticketNumber,
  dialog,
  onClose,
}: {
  repairId: string
  ticketNumber: number
  dialog: NoteMove | null
  onClose: () => void
}) {
  const { t } = useI18n()
  return (
    <>
      <StatusMoveDialog
        repairId={repairId}
        ticketNumber={ticketNumber}
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
        ticketNumber={ticketNumber}
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
  const canManage = useAuthStore((s) => s.hasPermission("repair.manage"))
  const change = useChangeRepairStatus(repair.id)
  const [dialog, setDialog] = React.useState<NoteMove | null>(null)
  const moves = allowedMoves(repair.statusCode)
  const owed = Number(repair.outstanding) > 0

  const onMove = (code: string) => {
    if (code === "CANCELLED") return setDialog("CANCELLED")
    if (code === "GIVEN_BACK" && owed) return setDialog("GIVEN_BACK")
    change.mutate(
      { toStatusCode: code },
      {
        onSuccess: () => toast.success(t("repairs.statusChanged")),
        onError: (err: Error) => {
          const { message, queued } = repairMutationError(err, t)
          if (queued) toast.success(message)
          else toast.error(message)
        },
      }
    )
  }

  if (!canManage) return <p className="text-xs text-muted-foreground">{t("repairs.noPermissionStatus")}</p>
  if (moves.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {moves.map((code) => (
        <Button key={code} size="sm" variant={moveVariant(code)} disabled={change.isPending} onClick={() => onMove(code)}>
          {t(MOVE_LABEL[code] ?? code)}
        </Button>
      ))}
      <NoteDialogs
        repairId={repair.id}
        ticketNumber={repair.ticketNumber}
        dialog={dialog}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}
