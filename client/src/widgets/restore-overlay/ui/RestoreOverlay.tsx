import { useEffect } from "react"
import { Loader2, AlertTriangle, LogIn } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useMaintenanceStore } from "@/shared/lib/maintenance.store"
import { clearOfflineData } from "@/shared/lib/offline"
import { useRestoreStatus } from "@/entities/backup"
import { useWipeStatus } from "@/features/wipe-shop-data"
import { useAuthStore } from "@/features/auth"
import { useCartStore } from "@/features/checkout"
import { Button } from "@/shared/ui/button"

/**
 * While the server restores a backup, erases shop data, OR performs a factory reset,
 * the whole site shows this one screen instead of error toasts (any 503 `MAINTENANCE`
 * turns it on). It polls the matching status and, when the operation is over:
 * - for restore or wipe: sends the user to /login
 * - for reset: lands on the first-boot setup wizard /setup
 */
export function RestoreOverlay() {
  const { t } = useI18n()
  const active = useMaintenanceStore((s) => s.active)
  const mode = useMaintenanceStore((s) => s.mode)
  const clearSession = useAuthStore((s) => s.clearSession)
  const clearCart = useCartStore((s) => s.clear)
  const isWipe = mode === "wipe"
  const isReset = mode === "reset"
  const isWipeOrReset = isWipe || isReset

  const restore = useRestoreStatus({
    enabled: active && !isWipeOrReset,
    refetchInterval: active && !isWipeOrReset ? 2500 : undefined,
  })
  const wipe = useWipeStatus({
    enabled: active && isWipeOrReset,
    refetchInterval: active && isWipeOrReset ? 2500 : undefined,
  })

  const isError = isWipeOrReset ? wipe.isError : restore.isError
  const inProgress = isWipeOrReset
    ? wipe.data?.wiping
    : restore.data?.restoring
  // The status route 401s once sessions end — that too means "it is over".
  const finished = isError || inProgress === false
  const needsManual = (isWipeOrReset ? wipe.data : restore.data)?.needsManualRecovery === true

  const cleanupLocalData = () => {
    try {
      clearCart()
    } catch {
      // a missing cart store is fine
    }
    void clearOfflineData()
    clearSession()
  }

  const signIn = () => {
    cleanupLocalData()
    window.location.assign("/login")
  }

  const goToSetup = () => {
    cleanupLocalData()
    window.location.assign("/setup")
  }

  useEffect(() => {
    if (active && isReset && finished && !needsManual) {
      const timer = setTimeout(() => {
        goToSetup()
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [active, isReset, finished, needsManual])

  if (!active) return null

  const busyTitle = isReset
    ? "backups.overlayResettingTitle"
    : isWipe
      ? "backups.overlayWipingTitle"
      : "backups.overlayRestoringTitle"
  const busyBody = isReset
    ? "backups.overlayResettingBody"
    : isWipe
      ? "backups.overlayWipingBody"
      : "backups.overlayRestoringBody"
  const doneTitle = isReset
    ? "backups.overlayResetDoneTitle"
    : isWipe
      ? "backups.overlayWipeDoneTitle"
      : "backups.overlayDoneTitle"
  const doneBody = isReset
    ? "backups.overlayResetDoneBody"
    : isWipe
      ? "backups.overlayWipeDoneBody"
      : "backups.overlayDoneBody"

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6">
      <div className="max-w-md text-center space-y-4">
        {!finished && (
          <>
            <Loader2 className="size-10 mx-auto animate-spin text-primary" />
            <h2 className="text-lg font-bold">{t(busyTitle)}</h2>
            <p className="text-sm text-muted-foreground">{t(busyBody)}</p>
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
            <h2 className="text-lg font-bold">{t(doneTitle)}</h2>
            <p className="text-sm text-muted-foreground">{t(doneBody)}</p>
            {isReset ? (
              <Button type="button" onClick={goToSetup} className="h-9 rounded-full px-5 text-xs font-semibold">
                {t("backups.overlayGoToSetup")}
              </Button>
            ) : (
              <Button type="button" onClick={signIn} className="h-9 rounded-full px-5 text-xs font-semibold">
                {t("backups.overlaySignIn")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
