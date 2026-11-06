import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import type { StorefrontOrderStatusHistoryView } from "@/entities/order"

export function OrderHistorySection({
  history,
}: {
  history: StorefrontOrderStatusHistoryView[]
}) {
  const { t } = useI18n()

  if (!history || history.length === 0) return null

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("orders.history")}
      </div>
      <div className="space-y-2">
        {history.map((h) => (
          <div
            key={h.id}
            className="text-xs p-2.5 rounded-xl bg-muted border border-border space-y-1"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-medium text-foreground">
                {h.fromStatusCode ? `${h.fromStatusCode} → ` : ""}
                <span className="font-bold">{h.toStatusCode}</span>
              </span>
              <span className="text-[11px]">{formatDateTime(h.changedAt)}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              {t("orders.handledBy")}: {h.changedByName || h.changedById}
              {h.note && ` (${h.note})`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
