import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDateTime } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { differenceKind, type ShiftListItem } from "@/entities/shift"

function DifferenceCell({ item }: { item: ShiftListItem }) {
  const { t } = useI18n()
  if (item.closedAt === null) return <Badge variant="violet">{t("shifts.stillOpen")}</Badge>
  if (item.difference === null) return <span className="text-muted-foreground">—</span>
  const kind = differenceKind(item.difference)
  const tone = kind === "short" ? "text-destructive" : kind === "over" ? "text-emerald-600 dark:text-emerald-400" : ""
  return <span className={`font-mono ${tone}`}>{formatMoney(item.difference)}</span>
}

export interface ShiftsTableProps {
  items: ShiftListItem[]
  onOpen: (id: string) => void
  canManage: boolean
  meId?: string
  onForceClose: (item: ShiftListItem) => void
}

function ShiftRow({
  item,
  onOpen,
  canForce,
  onForceClose,
}: {
  item: ShiftListItem
  onOpen: (id: string) => void
  canForce: boolean
  onForceClose: (item: ShiftListItem) => void
}) {
  const { t } = useI18n()
  return (
    <TableRow className="cursor-pointer" onClick={() => onOpen(item.id)}>
      <TableCell className="font-semibold">{item.cashier.name}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{formatDateTime(item.openedAt)}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {item.closedAt ? formatDateTime(item.closedAt) : t("shifts.stillOpen")}
      </TableCell>
      <TableCell className="font-mono">{formatMoney(item.openingCount)}</TableCell>
      <TableCell className="font-mono">
        {item.closingCount === null ? "—" : formatMoney(item.closingCount)}
      </TableCell>
      <TableCell>
        <DifferenceCell item={item} />
      </TableCell>
      <TableCell>
        {canForce && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onForceClose(item)
            }}
          >
            {t("shifts.forceClose")}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}

export function ShiftsTable({ items, onOpen, canManage, meId, onForceClose }: ShiftsTableProps) {
  const { t } = useI18n()

  if (items.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("shifts.noShifts")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("shifts.cashier")}</TableHead>
            <TableHead>{t("shifts.openedAt")}</TableHead>
            <TableHead>{t("shifts.closedAt")}</TableHead>
            <TableHead>{t("shifts.openingCash")}</TableHead>
            <TableHead>{t("shifts.countedCash")}</TableHead>
            <TableHead>{t("shifts.difference")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <ShiftRow
              key={item.id}
              item={item}
              onOpen={onOpen}
              canForce={canManage && item.closedAt === null && item.cashier.id !== meId}
              onForceClose={onForceClose}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
