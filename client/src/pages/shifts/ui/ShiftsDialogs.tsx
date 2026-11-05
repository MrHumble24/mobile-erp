import * as React from "react"
import { useShiftReport, type ShiftListItem, type ShiftReport } from "@/entities/shift"
import { ShiftReportDialog, ForceCloseShiftDialog } from "@/features/manage-shift"

export interface ShiftsDialogsProps {
  detailId: string | null
  onCloseDetail: () => void
  forceTarget: ShiftListItem | null
  onCloseForce: () => void
}

/** The shifts page's dialogs: view a report, force-close a shift, then show its
 *  report. Kept apart from the page so each stays a single small concern. */
export function ShiftsDialogs({ detailId, onCloseDetail, forceTarget, onCloseForce }: ShiftsDialogsProps) {
  const { data: report } = useShiftReport(detailId)
  const [forced, setForced] = React.useState<ShiftReport | null>(null)

  return (
    <>
      <ShiftReportDialog
        report={detailId ? (report ?? null) : null}
        open={detailId !== null}
        onOpenChange={(v) => !v && onCloseDetail()}
      />
      <ForceCloseShiftDialog
        shiftId={forceTarget?.id ?? null}
        cashierName={forceTarget?.cashier.name}
        open={forceTarget !== null}
        onOpenChange={(v) => !v && onCloseForce()}
        onClosed={(r) => {
          onCloseForce()
          setForced(r)
        }}
      />
      <ShiftReportDialog report={forced} open={forced !== null} onOpenChange={(v) => !v && setForced(null)} />
    </>
  )
}
