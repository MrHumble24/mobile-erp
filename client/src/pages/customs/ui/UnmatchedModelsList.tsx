import { useI18n } from "@/shared/i18n"
import type { UnmatchedModel } from "@/entities/customs"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function reasonKey(reason: UnmatchedModel["reason"]): string {
  return reason === "MISSING_CODE" ? "customs.reasonMissingCode" : "customs.reasonNotInList"
}

export function UnmatchedModelsList({ models }: { models: UnmatchedModel[] }) {
  const { t } = useI18n()
  if (models.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{t("customs.unmatchedTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("customs.unmatchedEmpty")}</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t("customs.unmatchedTitle")}</h3>
      <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inventory.brand")}</TableHead>
              <TableHead>{t("inventory.model")}</TableHead>
              <TableHead>{t("customs.customsCode")}</TableHead>
              <TableHead>{t("reports.reason")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium">{m.brand}</TableCell>
                <TableCell className="text-sm">{m.name}</TableCell>
                <TableCell className="font-mono text-xs">{m.customsCode || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t(reasonKey(m.reason))}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
