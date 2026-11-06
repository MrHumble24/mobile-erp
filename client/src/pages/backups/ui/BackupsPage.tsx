import { useEffect } from "react"
import { useSearchParams } from "react-router"
import { useQueryClient } from "@tanstack/react-query"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useBackupSettings, backupKeys } from "@/entities/backup"
import { PassphraseCard } from "@/features/set-backup-passphrase"
import { ScheduleCard } from "@/features/edit-backup-schedule"
import { UploadRestoreCard } from "@/features/restore-backup"
import { BackupPlaces } from "@/widgets/backup-places"
import { BackupRunsTable } from "@/widgets/backup-runs"
import { PageHeader } from "@/shared/ui/page-header"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/sonner"

/** Reads the OAuth round-trip result the server appends to the return URL
 * (`?backupConnected=` / `?backupError=`), tells the user, and refreshes. */
function useOauthReturn() {
  const { t } = useI18n()
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()

  useEffect(() => {
    const connected = params.get("backupConnected")
    const errored = params.get("backupError")
    if (!connected && !errored) return
    if (connected) toast.success(t("backups.oauthConnected"))
    if (errored) toast.error(t("backups.oauthFailed"))
    qc.invalidateQueries({ queryKey: backupKeys.places() })
    const next = new URLSearchParams(params)
    next.delete("backupConnected")
    next.delete("backupError")
    setParams(next, { replace: true })
  }, [params, qc, setParams, t])
}

export function BackupsPage() {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("backup.manage"))
  const canRestore = useAuthStore((s) => s.hasPermission("backup.restore"))
  const { data: settings, isLoading } = useBackupSettings()
  useOauthReturn()

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title={t("backups.title")} description={t("backups.subtitle")} />

      {isLoading && <Skeleton className="h-96 rounded-[16px]" />}

      {settings && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <PassphraseCard settings={settings} canManage={canManage} />
            <ScheduleCard settings={settings} canManage={canManage} />
          </div>

          <BackupPlaces canManage={canManage} />

          <BackupRunsTable canManage={canManage} canRestore={canRestore} />

          {canRestore && <UploadRestoreCard />}
        </>
      )}
    </div>
  )
}
