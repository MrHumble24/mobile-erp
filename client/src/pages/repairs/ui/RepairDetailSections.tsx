import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import type { RepairView } from "@/entities/repair"

function Line({ label, value, strong, danger }: { label: string; value: string; strong?: boolean; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${strong ? "font-bold" : ""} ${danger ? "text-destructive" : ""}`}>{value}</span>
    </div>
  )
}

/** Agreed / paid / left-to-pay always; cost figures only when the server sends
 *  them (the caller has `device.cost.view`). Never render a null cost. */
export function RepairMoneySummary({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const outstanding = Number(repair.outstanding)
  return (
    <div className="rounded-[12px] border border-border bg-muted p-3">
      <h3 className="text-sm font-semibold tracking-tight mb-1">{t("repairs.moneyTitle")}</h3>
      <Line label={t("repairs.agreedPrice")} value={formatMoney(repair.agreedPrice)} strong />
      <Line label={t("repairs.paid")} value={formatMoney(repair.paid)} />
      <Line
        label={outstanding < 0 ? t("repairs.overpaid") : t("repairs.leftToPay")}
        value={formatMoney(Math.abs(outstanding))}
        danger={outstanding > 0}
      />
      {repair.partsCost != null && <Line label={t("repairs.partsCost")} value={formatMoney(repair.partsCost)} />}
      {repair.outsidePaid != null && <Line label={t("repairs.outsidePaid")} value={formatMoney(repair.outsidePaid)} />}
      {repair.profit != null && <Line label={t("repairs.profit")} value={formatMoney(repair.profit)} strong />}
    </div>
  )
}

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

/** Warranty window, shown once the phone is given back. */
export function RepairWarranty({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  if (!repair.givenBackAt) return null
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight">{t("repairs.warrantyTitle")}</h3>
      <div className="flex items-center gap-2 text-sm">
        {repair.underWarranty ? (
          <Badge variant="emerald">{t("repairs.underWarranty")}</Badge>
        ) : (
          <Badge variant="outline">{t("repairs.noWarranty")}</Badge>
        )}
        {repair.warrantyUntil && (
          <span className="text-muted-foreground">
            {t("repairs.warrantyUntil")}: {formatDate(repair.warrantyUntil)}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("repairs.givenBackAt")}: {formatDate(repair.givenBackAt)}
      </p>
    </div>
  )
}
