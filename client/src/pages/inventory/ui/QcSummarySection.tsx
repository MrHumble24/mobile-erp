import { useI18n } from "@/shared/i18n"

interface Qc {
  passed: boolean
  gradeCode: string | null
  batteryHealth: number | null
}

export function QcSummarySection({ qc }: { qc: Qc | null }) {
  const { t } = useI18n()
  if (!qc) return <p className="text-sm text-muted-foreground">{t("inventory.noQc")}</p>
  return (
    <div className="rounded-lg border p-3 space-y-1 bg-card/60 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t("qc.result")}:</span>
        <span className={qc.passed ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
          {qc.passed ? t("qc.passed") : t("qc.failed")}
        </span>
      </div>
      {qc.gradeCode && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("qc.grade")}:</span>
          <span className="font-medium">{qc.gradeCode}</span>
        </div>
      )}
      {qc.batteryHealth != null && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("qc.batteryHealth")}:</span>
          <span className="font-medium">{qc.batteryHealth}%</span>
        </div>
      )}
    </div>
  )
}
