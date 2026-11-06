import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { RepairStatusBadge, type RepairListItem } from "@/entities/repair"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function RepairRow({ r, onOpen }: { r: RepairListItem; onOpen: (id: string) => void }) {
  const { t } = useI18n()
  return (
    <TableRow className="cursor-pointer" onClick={() => onOpen(r.id)}>
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
        {Number(r.outstanding) > 0 ? (
          <span className="text-destructive">{formatMoney(r.outstanding)}</span>
        ) : (
          formatMoney(r.outstanding)
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatDate(r.receivedAt)}</TableCell>
    </TableRow>
  )
}

export function RepairsTable({
  repairs,
  onOpen,
}: {
  repairs: RepairListItem[]
  onOpen: (id: string) => void
}) {
  const { t } = useI18n()

  if (repairs.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#d4d4d4] bg-white p-8 text-center text-sm text-muted-foreground">
        {t("repairs.noTickets")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-white shadow-[var(--shadow-xs)]">
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
