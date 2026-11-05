import { Printer } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { ShiftReportView, type ShiftReport } from "@/entities/shift"

export interface ShiftReportDialogProps {
  report: ShiftReport | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Shows a shift report with a print button, reusing the receipt print path. */
export function ShiftReportDialog({ report, open, onOpenChange }: ShiftReportDialogProps) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <DialogTitle>{t("shifts.report")}</DialogTitle>
          <DialogDescription>{report?.cashier.name ?? ""}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end print:hidden">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!report}
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            {t("common.print")}
          </Button>
        </div>
        <div className="flex justify-center py-2">{report && <ShiftReportView report={report} />}</div>
      </DialogPopup>
    </Dialog>
  )
}
