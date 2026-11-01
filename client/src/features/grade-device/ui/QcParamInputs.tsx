import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Textarea } from "@/shared/ui/textarea"
import type { LookupView } from "@/entities/qc"

function GradeBatteryRow({
  grades,
  gradeCode,
  onGradeChange,
  batteryHealth,
  onBatteryChange,
}: {
  grades: LookupView[]
  gradeCode: string
  onGradeChange: (val: string) => void
  batteryHealth: number
  onBatteryChange: (val: number) => void
}) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label>{t("qc.grade")}</Label>
        <Select value={gradeCode} onValueChange={(val) => onGradeChange(val || "")}>
          <SelectTrigger className="h-10"><SelectValue placeholder={t("qc.selectGrade")} /></SelectTrigger>
          <SelectContent>
            {grades.map((g) => (
              <SelectItem key={g.code} value={g.code}>{g.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t("qc.batteryHealth")}</Label>
        <Input type="number" min={0} max={100} value={batteryHealth} onChange={(e) => onBatteryChange(Number(e.target.value))} className="h-10" />
      </div>
    </div>
  )
}

export function QcParamInputs({
  grades,
  gradeCode,
  onGradeChange,
  batteryHealth,
  onBatteryChange,
  repairCost,
  onRepairCostChange,
  notes,
  onNotesChange,
}: {
  grades: LookupView[]
  gradeCode: string
  onGradeChange: (val: string) => void
  batteryHealth: number
  onBatteryChange: (val: number) => void
  repairCost: number
  onRepairCostChange: (val: number) => void
  notes: string
  onNotesChange: (val: string) => void
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      <GradeBatteryRow
        grades={grades}
        gradeCode={gradeCode}
        onGradeChange={onGradeChange}
        batteryHealth={batteryHealth}
        onBatteryChange={onBatteryChange}
      />
      <div className="space-y-1">
        <Label>{t("qc.repairCostEstimate")}</Label>
        <Input type="number" min={0} value={repairCost} onChange={(e) => onRepairCostChange(Number(e.target.value))} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("common.notes")}</Label>
        <Textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} placeholder="..." className="min-h-16 py-2 px-3 text-sm" />
      </div>
    </div>
  )
}
