import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useDefectTypes, useGrades, useCreateInspection, type CreateInspectionDto } from "@/entities/qc"
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { toast } from "@/shared/ui/sonner"
import { DefectsChecklist } from "./DefectsChecklist"
import { QcParamInputs } from "./QcParamInputs"

function PassFailBanner({ passed, onToggle }: { passed: boolean; onToggle: (val: boolean) => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between p-3.5 border border-[#e8e8e8] rounded-[14px] bg-[#f8f9fa]">
      <div>
        <Label className="text-base font-semibold">{t("qc.result")}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{passed ? t("qc.passed") : t("qc.failed")}</p>
      </div>
      <Switch checked={passed} onCheckedChange={(val) => onToggle(Boolean(val))} />
    </div>
  )
}

function toPayload(deviceId: string, passed: boolean, gradeCode: string, battery: number, cost: number, notes: string, defects: string[]): CreateInspectionDto {
  return {
    deviceId,
    passed,
    gradeCode: gradeCode || undefined,
    batteryHealth: battery,
    repairCostEstimate: cost > 0 ? cost : undefined,
    notes: notes || undefined,
    defects: defects.map((defectCode) => ({ defectCode })),
  }
}

function GradeDeviceForm({ deviceId, onDone }: { deviceId: string; onDone: () => void }) {
  const { t } = useI18n()
  const { data: defectTypesData } = useDefectTypes()
  const { data: gradesData } = useGrades()
  const createMutation = useCreateInspection()

  const [passed, setPassed] = React.useState(true)
  const [gradeCode, setGradeCode] = React.useState("A")
  const [batteryHealth, setBatteryHealth] = React.useState(100)
  const [repairCost, setRepairCost] = React.useState(0)
  const [notes, setNotes] = React.useState("")
  const [defects, setDefects] = React.useState<string[]>([])

  const toggleDefect = (code: string) => {
    setDefects((p) => p.includes(code) ? p.filter((c) => c !== code) : [...p, code])
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(
      toPayload(deviceId, passed, gradeCode, batteryHealth, repairCost, notes, defects),
      { onSuccess: () => { toast.success(t("qc.inspectionSaved")); onDone() } }
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4 my-2">
      <PassFailBanner passed={passed} onToggle={setPassed} />
      <QcParamInputs
        grades={gradesData || []}
        gradeCode={gradeCode}
        onGradeChange={setGradeCode}
        batteryHealth={batteryHealth}
        onBatteryChange={setBatteryHealth}
        repairCost={repairCost}
        onRepairCostChange={setRepairCost}
        notes={notes}
        onNotesChange={setNotes}
      />
      <DefectsChecklist defectTypes={defectTypesData || []} selectedCodes={defects} onToggle={toggleDefect} />
      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        {createMutation.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </form>
  )
}

export function GradeDeviceDialog({
  deviceId,
  imei,
  open,
  onOpenChange,
}: {
  deviceId: string
  imei: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("qc.runInspection")}</DialogTitle>
          <DialogDescription className="font-mono text-sm">{imei}</DialogDescription>
        </DialogHeader>
        <GradeDeviceForm deviceId={deviceId} onDone={() => onOpenChange(false)} />
      </DialogPopup>
    </Dialog>
  )
}
