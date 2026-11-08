import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import { RepairStatusBadge, type RepairView } from "@/entities/repair"

/** Every status change on the ticket, newest first. */
export function RepairHistory({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  if (repair.statusHistory.length === 0) return null
  const rows = [...repair.statusHistory].reverse()
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold tracking-tight">{t("repairs.historyTitle")}</h3>
      <div className="space-y-1.5">
        {rows.map((h, i) => (
          <div key={`${h.changedAt}-${i}`} className="rounded-[10px] border border-border bg-card p-2.5 text-sm">
            <div className="flex items-center justify-between gap-2">
              <RepairStatusBadge statusCode={h.toStatusCode} />
              <span className="text-xs text-muted-foreground">{formatDateTime(h.changedAt)}</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{h.changedBy.name}</div>
            {h.note && <p className="mt-1 text-xs whitespace-pre-wrap">{h.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
