import { Pencil } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import type { LookupView } from "@/entities/qc"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"

export function LookupTable({ rows, onEdit }: { rows: LookupView[]; onEdit: (row: LookupView) => void }) {
  const { t } = useI18n()
  if (rows.length === 0) {
    return <div className="py-8 text-center text-muted-foreground text-sm">{t("common.notFound")}</div>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("qc.lookupCode")}</TableHead>
          <TableHead>{t("qc.lookupLabel")}</TableHead>
          <TableHead className="text-center">{t("qc.sortOrder")}</TableHead>
          <TableHead className="text-center">{t("qc.active")}</TableHead>
          <TableHead className="text-right">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.code} className={row.isActive ? undefined : "opacity-60"}>
            <TableCell className="font-mono text-xs">{row.code}</TableCell>
            <TableCell className="font-medium">{row.label}</TableCell>
            <TableCell className="text-center text-muted-foreground">{row.sortOrder}</TableCell>
            <TableCell className="text-center">
              <Badge variant={row.isActive ? "mint" : "outline"} size="sm">
                {row.isActive ? t("common.yes") : t("common.no")}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                <Pencil className="size-3.5" />
                {t("common.edit")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
