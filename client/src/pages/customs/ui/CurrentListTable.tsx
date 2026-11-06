import { Check } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { feeChangeOf, type CurrentPriceList } from "@/entities/customs"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { FeeChangeBadge } from "./FeeChangeBadge"

export function CurrentListTable({ list }: { list: CurrentPriceList }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <h3 className="font-semibold">{t("customs.currentList")}</h3>
        <span className="text-xs text-muted-foreground">
          {t("customs.effectiveAt")}: {formatDate(list.effectiveAt)}
          {list.note ? ` · ${list.note}` : ""}
        </span>
      </div>
      <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customs.customsCode")}</TableHead>
              <TableHead>{t("customs.description")}</TableHead>
              <TableHead className="text-right">{t("customs.fee")}</TableHead>
              <TableHead className="text-right">{t("customs.previousFee")}</TableHead>
              <TableHead>{t("customs.change")}</TableHead>
              <TableHead>{t("customs.usedByModel")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.map((item) => (
              <TableRow key={item.customsCode}>
                <TableCell className="font-mono text-xs font-semibold">{item.customsCode}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.description || "—"}</TableCell>
                <TableCell className="font-mono text-sm text-right">{formatMoney(item.fee)}</TableCell>
                <TableCell className="font-mono text-sm text-right text-muted-foreground">
                  {item.previousFee == null ? "—" : formatMoney(item.previousFee)}
                </TableCell>
                <TableCell><FeeChangeBadge change={feeChangeOf(item)} /></TableCell>
                <TableCell>
                  {item.usedByModel ? (
                    <Badge variant="mint" className="gap-1">
                      <Check className="size-3" />
                      {t("customs.usedByModel")}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t("customs.notUsed")}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
