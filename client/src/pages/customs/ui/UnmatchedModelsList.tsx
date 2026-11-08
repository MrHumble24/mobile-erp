import { useI18n } from "@/shared/i18n"
import type { UnmatchedModel } from "@/entities/customs"
import { Badge } from "@/shared/ui/badge"
import { Link } from "@/shared/ui/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function reasonKeys(reason: UnmatchedModel["reason"]): { label: string; fix: string } {
  return reason === "MISSING_CODE"
    ? { label: "customs.reasonMissingCode", fix: "customs.unmatchedFixMissing" }
    : { label: "customs.reasonNotInList", fix: "customs.unmatchedFixNotInList" }
}

function UnmatchedTable({ models }: { models: UnmatchedModel[] }) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.brand")}</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("customs.customsCode")}</TableHead>
            <TableHead>{t("reports.reason")}</TableHead>
            <TableHead>{t("customs.unmatchedFixColumn")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((m) => {
            const keys = reasonKeys(m.reason)
            return (
              <TableRow key={m.id}>
                <TableCell className="text-sm font-medium">{m.brand}</TableCell>
                <TableCell className="text-sm">{m.name}</TableCell>
                <TableCell className="font-mono text-xs">{m.customsCode || "—"}</TableCell>
                <TableCell><Badge variant="outline">{t(keys.label)}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{t(keys.fix)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function UnmatchedModelsList({
  models,
  canManageModels,
}: {
  models: UnmatchedModel[]
  canManageModels: boolean
}) {
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          {t("customs.unmatchedTitle")} · {t("customs.itemCount", { count: models.length })}
        </h3>
        {canManageModels && (
          <Link to="/inventory?tab=models" className="text-xs">
            {t("customs.openModels")}
          </Link>
        )}
      </div>
      <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
        {t("customs.unmatchedHelp")}
      </p>
      <UnmatchedTable models={models} />
    </div>
  )
}
