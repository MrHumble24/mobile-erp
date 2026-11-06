import * as React from "react"
import { Clock, LockKeyhole } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { useCurrentShift, type ShiftReport } from "@/entities/shift"
import { OpenShiftDialog } from "./OpenShiftDialog"
import { CloseShiftDialog } from "./CloseShiftDialog"
import { ShiftReportDialog } from "./ShiftReportDialog"

function formatTime(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function StatusBar({
  current,
  onOpen,
  onClose,
}: {
  current: ShiftReport | null
  onOpen: () => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const isOpen = current != null
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-[14px] border p-3 ${
        isOpen ? "border-border bg-white" : "border-[#fec84b] bg-[#fffaeb]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        {isOpen ? <Clock className="size-5 text-primary" /> : <LockKeyhole className="size-5 text-[#b54708]" />}
        <div className="leading-tight">
          <div className="text-sm font-semibold">
            {isOpen ? t("shifts.openSince", { time: formatTime(current.openedAt) }) : t("shifts.noOpenShift")}
          </div>
          {!isOpen && <div className="text-xs text-[#b54708]">{t("shifts.shiftRequired")}</div>}
        </div>
      </div>
      {isOpen ? (
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          {t("shifts.closeShift")}
        </Button>
      ) : (
        <Button type="button" size="sm" onClick={onOpen}>
          {t("shifts.openShift")}
        </Button>
      )}
    </div>
  )
}

/** The till shift bar: open/close the current shift. Mounted only when shifts
 *  are enabled; when no shift is open it is the visible gate that blocks selling. */
export function ShiftBar() {
  const { data: current, isLoading } = useCurrentShift()
  const [openDialog, setOpenDialog] = React.useState(false)
  const [closeDialog, setCloseDialog] = React.useState(false)
  const [report, setReport] = React.useState<ShiftReport | null>(null)

  if (isLoading) return <Skeleton className="h-14 rounded-[14px]" />

  return (
    <>
      <StatusBar current={current ?? null} onOpen={() => setOpenDialog(true)} onClose={() => setCloseDialog(true)} />
      <OpenShiftDialog open={openDialog} onOpenChange={setOpenDialog} />
      <CloseShiftDialog
        open={closeDialog}
        onOpenChange={setCloseDialog}
        onClosed={(r) => {
          setCloseDialog(false)
          setReport(r)
        }}
      />
      <ShiftReportDialog report={report} open={report !== null} onOpenChange={(v) => !v && setReport(null)} />
    </>
  )
}
