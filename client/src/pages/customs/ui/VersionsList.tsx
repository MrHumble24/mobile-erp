import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import type { PriceListSummary } from "@/entities/customs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

export function VersionsList({ versions }: { versions: PriceListSummary[] }) {
  const { t } = useI18n()
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("customs.emptyList")}</p>
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("customs.versions")}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{t("customs.versionsHint")}</p>
      <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("customs.effectiveAt")}</TableHead>
              <TableHead>{t("inventory.tabModels")}</TableHead>
              <TableHead>{t("customs.note")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="text-sm font-medium">{formatDate(v.effectiveAt)}</TableCell>
                <TableCell className="text-sm">{t("customs.itemCount", { count: v.itemCount })}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[220px] truncate">{v.note || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
