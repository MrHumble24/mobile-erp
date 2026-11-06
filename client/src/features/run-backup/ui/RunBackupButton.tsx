import { Loader2, DatabaseBackup } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  useRunBackup,
  useBackupSettings,
  backupErrorMessage,
  type BackupRunView,
} from "@/entities/backup"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"

/** "Back up now". Disabled until a readable passphrase is set; the per-place
 * result shows in the runs table, a partly-failed run is flagged by a toast. */
export function RunBackupButton() {
  const { t } = useI18n()
  const run = useRunBackup()
  const { data: settings } = useBackupSettings()
  const ready = settings?.passphraseStatus === "set"

  const onClick = () =>
    run.mutate(undefined, {
      onSuccess: (runs: BackupRunView[]) => {
        const latest = runs[0]
        if (latest?.partlyFailed) toast.warning(t("backups.runPartlyFailed"))
        else toast.success(t("backups.runDone"))
      },
      onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
    })

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={run.isPending || !ready}
      title={ready ? undefined : t("backups.runNeedsPassphrase")}
      className="h-9 rounded-full px-5 text-xs font-semibold"
    >
      {run.isPending ? (
        <Loader2 className="size-4 mr-1.5 animate-spin" />
      ) : (
        <DatabaseBackup className="size-4 mr-1.5" />
      )}
      {run.isPending ? t("backups.running") : t("backups.runNow")}
    </Button>
  )
}
