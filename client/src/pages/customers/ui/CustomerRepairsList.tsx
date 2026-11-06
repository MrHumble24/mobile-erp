import { useNavigate } from "react-router"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { useRepairs, RepairStatusBadge } from "@/entities/repair"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"

/** This customer's repair tickets, shown on their detail; a row jumps to the
 *  repairs page. Rendered only when repairs are enabled (see the caller). */
export function CustomerRepairsList({ customerId }: { customerId: string }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data, isLoading } = useRepairs({ customerId, page: 1, pageSize: 20 })

  if (isLoading) return <Skeleton className="h-20 rounded-[12px]" />
  if (!data || data.items.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("repairs.noTickets")}</p>
  }

  return (
    <div className="space-y-2">
      {data.items.map((r) => (
        <Button
          key={r.id}
          type="button"
          variant="outline"
          onClick={() => navigate("/repairs")}
          className="flex h-auto w-full items-center justify-between gap-3 rounded-[10px] border-border bg-card p-2.5 text-left text-sm font-normal"
        >
          <span className="min-w-0">
            <span className="block font-semibold truncate">
              #{r.ticketNumber} · {r.deviceName}
            </span>
            <span className="block text-xs text-muted-foreground">
              {formatMoney(r.agreedPrice)} · {formatDate(r.receivedAt)}
            </span>
          </span>
          <RepairStatusBadge statusCode={r.statusCode} statusLabel={r.statusLabel} />
        </Button>
      ))}
    </div>
  )
}
