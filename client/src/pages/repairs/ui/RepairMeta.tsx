import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { RepairView } from "@/entities/repair"
import { Line } from "./RepairDetailLine"

function masterText(repair: RepairView, t: (k: string) => string): string {
  const m = repair.master
  if (m?.kind === "OWN") return `${t("repairs.masterOwn")}: ${m.name}`
  if (m?.kind === "OUTSIDE") return `${t("repairs.masterOutside")}: ${m.name}${m.phone ? ` · ${m.phone}` : ""}`
  return "—"
}

/** Device, master and notes — the ticket's descriptive fields. */
export function RepairMeta({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const code = repair.imei || repair.serialNumber
  return (
    <div className="space-y-2 text-sm">
      <Line label={t("repairs.device")} value={repair.deviceName} />
      {repair.model && <Line label={t("repairs.model")} value={repair.model} />}
      {code && <Line label={repair.imei ? t("repairs.imei") : t("repairs.serial")} value={code} />}
      <Line label={t("repairs.master")} value={masterText(repair, t)} />
      {repair.deviceId && (
        <p className="text-xs text-emerald-700 dark:text-emerald-300">{t("repairs.linkedDevice")}</p>
      )}
      {repair.outsideCost != null && <Line label={t("repairs.outsideCost")} value={formatMoney(repair.outsideCost)} />}
      <div className="pt-1">
        <span className="text-xs text-muted-foreground">{t("repairs.problem")}</span>
        <p className="mt-0.5 whitespace-pre-wrap text-sm">{repair.problem}</p>
      </div>
      {repair.notes && (
        <div className="rounded-[10px] border border-border bg-muted p-2.5 text-xs text-muted-foreground whitespace-pre-wrap">
          {repair.notes}
        </div>
      )}
    </div>
  )
}
