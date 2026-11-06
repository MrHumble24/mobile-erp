import { Download, Trash2, RotateCcw, Loader2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatBytes, formatDateTime } from "@/shared/lib/format"
import {
  useDownloadRun,
  backupErrorMessage,
  RUN_STATUS,
  type BackupRunView,
} from "@/entities/backup"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { TableCell, TableRow } from "@/shared/ui/table"
import { toast } from "@/shared/ui/sonner"
import { TargetMarks } from "./TargetMarks"

function StatusBadge({ run }: { run: BackupRunView }) {
  const { t } = useI18n()
  if (run.status === RUN_STATUS.RUNNING)
    return <Badge variant="blue" size="sm">{t("backups.statusRunning")}</Badge>
  if (run.status === RUN_STATUS.FAILED)
    return <Badge variant="destructive" size="sm">{t("backups.statusFailed")}</Badge>
  if (run.partlyFailed)
    return <Badge variant="amber" size="sm">{t("backups.statusPartlyFailed")}</Badge>
  return <Badge variant="emerald" size="sm">{t("backups.statusSuccess")}</Badge>
}

export interface BackupRunRowProps {
  run: BackupRunView
  canManage: boolean
  canRestore: boolean
  onRestore: (run: BackupRunView) => void
  onDelete: (run: BackupRunView) => void
}

export function BackupRunRow({ run, canManage, canRestore, onRestore, onDelete }: BackupRunRowProps) {
  const { t } = useI18n()
  const download = useDownloadRun()

  const onDownload = () =>
    download.mutate(run, {
      onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
    })

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{formatDateTime(run.startedAt)}</TableCell>
      <TableCell>{formatBytes(run.sizeBytes)}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {run.triggeredById ? t("backups.triggerManual") : t("backups.triggerSchedule")}
      </TableCell>
      <TableCell><TargetMarks targets={run.targets} /></TableCell>
      <TableCell><StatusBadge run={run} /></TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          {run.downloadable && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              title={t("backups.download")}
              disabled={download.isPending}
              onClick={onDownload}
            >
              {download.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
            </Button>
          )}
          {canRestore && run.downloadable && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              title={t("backups.restore")}
              onClick={() => onRestore(run)}
            >
              <RotateCcw className="size-4" />
            </Button>
          )}
          {canManage && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              title={t("common.delete")}
              onClick={() => onDelete(run)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
