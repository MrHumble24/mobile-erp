import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { useWipeRuns } from "../model/use-wipe"

/** The record of past erases, under the danger-zone card. Hidden when empty. */
export function WipeRunsTable({ enabled }: { enabled: boolean }) {
  const { t } = useI18n()
  const { data: runs } = useWipeRuns(enabled)
  if (!runs || runs.length === 0) return null

  const what = (r: { contacts: boolean; catalog: boolean }) => {
    const parts = [t("backups.wipeWhatBase")]
    if (r.contacts) parts.push(t("backups.wipeWhatContacts"))
    if (r.catalog) parts.push(t("backups.wipeWhatCatalog"))
    return parts.join(" + ")
  }
  const rowCount = (rows: Record<string, number>) =>
    Object.values(rows).reduce((a, b) => a + b, 0)

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{t("backups.wipeRecordTitle")}</h3>
      <div className="overflow-x-auto rounded-[16px] border border-[#e8e8e8] bg-white shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("backups.colDate")}</TableHead>
              <TableHead>{t("backups.colTrigger")}</TableHead>
              <TableHead>{t("backups.wipeColWhat")}</TableHead>
              <TableHead className="text-right">{t("backups.wipeColRows")}</TableHead>
              <TableHead>{t("common.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{formatDateTime(r.startedAt)}</TableCell>
                <TableCell className="font-mono text-xs">{r.performedById.slice(0, 8)}</TableCell>
                <TableCell>{what(r)}</TableCell>
                <TableCell className="text-right">{rowCount(r.rowsErased).toLocaleString()}</TableCell>
                <TableCell>
                  {r.status === "SUCCESS"
                    ? t("backups.statusSuccess")
                    : r.status === "FAILED"
                      ? t("backups.statusFailed")
                      : t("backups.statusRunning")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
