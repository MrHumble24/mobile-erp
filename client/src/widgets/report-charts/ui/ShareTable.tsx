import { useI18n } from "@/shared/i18n"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { OTHER_KEY, type SeriesPoint } from "../lib/palette"

export interface ShareTableProps {
  rows: SeriesPoint[]
  labelHeader: string
  valueHeader: string
  formatValue: (value: number) => string
  onSelect?: (key: string) => void
}

const formatShare = (share: number): string => `${(share * 100).toFixed(1)}%`

export function ShareTable({
  rows,
  labelHeader,
  valueHeader,
  formatValue,
  onSelect,
}: ShareTableProps) {
  const { t } = useI18n()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{labelHeader}</TableHead>
          <TableHead className="text-right">{valueHeader}</TableHead>
          <TableHead className="text-right">{t("reports.share")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const clickable = Boolean(onSelect) && row.key !== OTHER_KEY
          return (
            <TableRow
              key={row.key}
              className={clickable ? "cursor-pointer" : undefined}
              onClick={clickable ? () => onSelect?.(row.key) : undefined}
            >
              <TableCell className="font-semibold text-sm">{row.label}</TableCell>
              <TableCell className="font-mono text-sm text-right">
                {formatValue(row.value)}
              </TableCell>
              <TableCell className="font-mono text-sm text-right text-muted-foreground">
                {formatShare(row.share)}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
