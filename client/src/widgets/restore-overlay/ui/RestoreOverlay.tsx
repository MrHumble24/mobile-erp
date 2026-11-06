import { Loader2, AlertTriangle, LogIn } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useMaintenanceStore } from "@/shared/lib/maintenance.store"
import { useRestoreStatus } from "@/entities/backup"
import { useAuthStore } from "@/features/auth"
import { Button } from "@/shared/ui/button"

/**
 * While the server restores a backup, the whole site shows this one screen
 * instead of error toasts (any 503 `MAINTENANCE` turns it on). It polls the
 * restore status and, when the restore is over, sends the user to sign in
 * again — the restore ended every session.
 */
export function RestoreOverlay() {
  const { t } = useI18n()
  const active = useMaintenanceStore((s) => s.active)
  const clearSession = useAuthStore((s) => s.clearSession)

  const { data, isError } = useRestoreStatus({
    enabled: active,
    refetchInterval: active ? 2500 : undefined,
  })

  if (!active) return null

  // The status route 401s once sessions end — that too means "restore is over".
  const finished = isError || data?.restoring === false
  const needsManual = data?.needsManualRecovery === true

  const signIn = () => {
    clearSession()
    window.location.assign("/login")
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6">
      <div className="max-w-md text-center space-y-4">
        {!finished && (
          <>
            <Loader2 className="size-10 mx-auto animate-spin text-primary" />
            <h2 className="text-lg font-bold">{t("backups.overlayRestoringTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("backups.overlayRestoringBody")}</p>
          </>
        )}

        {finished && needsManual && (
          <>
            <AlertTriangle className="size-10 mx-auto text-destructive" />
            <h2 className="text-lg font-bold text-destructive">{t("backups.overlayManualTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("backups.overlayManualBody")}</p>
          </>
        )}

        {finished && !needsManual && (
          <>
            <LogIn className="size-10 mx-auto text-emerald-600" />
            <h2 className="text-lg font-bold">{t("backups.overlayDoneTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("backups.overlayDoneBody")}</p>
            <Button type="button" onClick={signIn} className="h-9 rounded-full px-5 text-xs font-semibold">
              {t("backups.overlaySignIn")}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
