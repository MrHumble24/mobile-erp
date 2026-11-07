import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import type { TrendPoint } from "@/entities/report"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

export function TrendTable({ data }: { data: TrendPoint[] }) {
  const { t } = useI18n()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.date")}</TableHead>
          <TableHead className="text-right">{t("dashboard.revenue")}</TableHead>
          <TableHead className="text-right">{t("dashboard.grossProfit")}</TableHead>
          <TableHead className="text-right">{t("dashboard.expenses")}</TableHead>
          <TableHead className="text-right">{t("dashboard.netOperatingIncome")}</TableHead>
          <TableHead className="text-right">{t("dashboard.unitsSold")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((p) => {
          const net = p.grossProfit - p.expenses
          return (
            <TableRow key={p.bucket}>
              <TableCell className="text-sm">{formatDate(p.bucket)}</TableCell>
              <TableCell className="font-mono text-sm text-right text-emerald-500 font-medium">
                {formatMoney(p.revenue)}
              </TableCell>
              <TableCell className="font-mono text-sm text-right text-sky-400 font-medium">
                {formatMoney(p.grossProfit)}
              </TableCell>
              <TableCell className="font-mono text-sm text-right text-rose-400">
                {formatMoney(p.expenses)}
              </TableCell>
              <TableCell
                className={`font-mono text-sm text-right font-semibold ${
                  net >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatMoney(net)}
              </TableCell>
              <TableCell className="font-mono text-sm text-right text-muted-foreground">
                {p.unitsSold}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
