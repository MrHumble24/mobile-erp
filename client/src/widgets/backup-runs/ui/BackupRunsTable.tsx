import { useState } from "react"
import { useI18n } from "@/shared/i18n"
import { useBackupRuns, type BackupRunView } from "@/entities/backup"
import { RunBackupButton } from "@/features/run-backup"
import { RestoreDialog } from "@/features/restore-backup"
import { Skeleton } from "@/shared/ui/skeleton"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { BackupRunRow } from "./BackupRunRow"
import { DeleteRunDialog } from "./DeleteRunDialog"

export function BackupRunsTable({
  canManage,
  canRestore,
}: {
  canManage: boolean
  canRestore: boolean
}) {
  const { t } = useI18n()
  const { data: runs, isLoading } = useBackupRuns()
  const [restoreRun, setRestoreRun] = useState<BackupRunView | null>(null)
  const [deleteRun, setDeleteRun] = useState<BackupRunView | null>(null)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{t("backups.runsTitle")}</h2>
        {canManage && <RunBackupButton />}
      </div>

      {isLoading && <Skeleton className="h-40 rounded-[16px]" />}

      {runs && runs.length === 0 && (
        <div className="rounded-[16px] border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {t("backups.runsEmpty")}
        </div>
      )}

      {runs && runs.length > 0 && (
        <div className="overflow-x-auto rounded-[16px] border border-border bg-card shadow-[var(--shadow-xs)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("backups.colDate")}</TableHead>
                <TableHead>{t("backups.colSize")}</TableHead>
                <TableHead>{t("backups.colTrigger")}</TableHead>
                <TableHead>{t("backups.colPlaces")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => (
                <BackupRunRow
                  key={run.id}
                  run={run}
                  canManage={canManage}
                  canRestore={canRestore}
                  onRestore={setRestoreRun}
                  onDelete={setDeleteRun}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <RestoreDialog
        open={!!restoreRun}
        onOpenChange={(o) => !o && setRestoreRun(null)}
        source={restoreRun ? { kind: "run", id: restoreRun.id } : null}
        backupDate={restoreRun?.startedAt ?? null}
      />
      <DeleteRunDialog
        run={deleteRun}
        open={!!deleteRun}
        onOpenChange={(o) => !o && setDeleteRun(null)}
      />
    </section>
  )
}
