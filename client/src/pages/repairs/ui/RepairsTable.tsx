import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { RepairStatusBadge, type RepairListItem } from "@/entities/repair"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function RepairRow({ r, onOpen }: { r: RepairListItem; onOpen: (id: string) => void }) {
  const { t } = useI18n()
  const outstanding = Number(r.outstanding)
  const open = () => onOpen(r.id)
  return (
    <TableRow
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
      tabIndex={0}
      role="button"
      aria-label={`${t("repairs.ticketLabel")} #${r.ticketNumber}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          open()
        }
      }}
    >
      <TableCell className="font-mono font-semibold">#{r.ticketNumber}</TableCell>
      <TableCell>
        <div className="font-semibold">{r.customer.name}</div>
        <div className="font-mono text-xs text-muted-foreground">{r.customer.phone || "—"}</div>
      </TableCell>
      <TableCell>
        <div className="truncate max-w-[180px]">{r.deviceName}</div>
        {r.imei && <div className="font-mono text-xs text-muted-foreground">{r.imei}</div>}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <RepairStatusBadge statusCode={r.statusCode} statusLabel={r.statusLabel} />
          {r.underWarranty && <Badge variant="emerald" size="sm">{t("repairs.underWarranty")}</Badge>}
        </div>
      </TableCell>
      <TableCell className="font-mono">{formatMoney(r.agreedPrice)}</TableCell>
      <TableCell className="font-mono font-semibold">
        {outstanding > 0 ? (
          <span className="text-destructive">{formatMoney(outstanding)}</span>
        ) : outstanding < 0 ? (
          <span className="text-emerald-600 dark:text-emerald-400" title={t("repairs.overpaid")}>
            {formatMoney(Math.abs(outstanding))}
          </span>
        ) : (
          formatMoney(0)
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatDate(r.receivedAt)}</TableCell>
    </TableRow>
  )
}

export function RepairsTable({
  repairs,
  onOpen,
  hasFilters = false,
  onClear,
}: {
  repairs: RepairListItem[]
  onOpen: (id: string) => void
  hasFilters?: boolean
  onClear?: () => void
}) {
  const { t } = useI18n()

  if (repairs.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        <p>{hasFilters ? t("repairs.noResults") : t("repairs.noTickets")}</p>
        {hasFilters && onClear && (
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={onClear}>
            {t("repairs.clearSearch")}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("repairs.ticketNumber")}</TableHead>
            <TableHead>{t("repairs.customer")}</TableHead>
            <TableHead>{t("repairs.device")}</TableHead>
            <TableHead>{t("repairs.status")}</TableHead>
            <TableHead>{t("repairs.agreedPrice")}</TableHead>
            <TableHead>{t("repairs.leftToPay")}</TableHead>
            <TableHead>{t("repairs.receivedDate")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repairs.map((r) => (
            <RepairRow key={r.id} r={r} onOpen={onOpen} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
