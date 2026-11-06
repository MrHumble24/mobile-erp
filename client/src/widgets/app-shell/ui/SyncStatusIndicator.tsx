import { CloudOff, RefreshCw, UploadCloud, AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useOnlineStatus } from "@/shared/lib/offline"
import { useOutboxStore, selectPendingCount, selectRejectedCount } from "@/entities/sync"
import { Link } from "@/shared/ui/link"
import { cn } from "@/shared/lib/utils"

type T = (k: string, p?: Record<string, string | number>) => string

function lastSyncLabel(t: T, at: number | null) {
  return at ? t("sync.lastSync", { time: new Date(at).toLocaleTimeString() }) : t("sync.neverSynced")
}

/** Header pill: online/offline dot, pending + rejected counts, click → /sync. */
export function SyncStatusIndicator() {
  const { t } = useI18n()
  const online = useOnlineStatus()
  const pending = useOutboxStore(selectPendingCount)
  const rejected = useOutboxStore(selectRejectedCount)
  const syncing = useOutboxStore((s) => s.syncing)
  const lastSyncAt = useOutboxStore((s) => s.lastSyncAt)

  const summary = `${online ? t("sync.online") : t("sync.offline")} · ${lastSyncLabel(t, lastSyncAt)}`

  return (
    <Link
      to="/sync"
      title={summary}
      aria-label={t("sync.openSync")}
      className="hidden sm:inline-flex items-center gap-1.5 px-3 h-8 rounded-full border text-[11px] font-medium no-underline shrink-0 transition-colors border-border text-foreground hover:border-foreground/40"
    >
      <span
        className={cn("size-1.5 rounded-full shrink-0", online ? "bg-emerald-500 animate-pulse" : "bg-amber-500")}
      />
      {online ? (
        syncing ? <RefreshCw className="size-3.5 animate-spin" /> : <span>{t("sync.online")}</span>
      ) : (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <CloudOff className="size-3.5" />
          {t("sync.offline")}
        </span>
      )}
      {pending > 0 && (
        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <UploadCloud className="size-3.5" />
          {pending}
        </span>
      )}
      {rejected > 0 && (
        <span className="inline-flex items-center gap-1 text-destructive">
          <AlertTriangle className="size-3.5" />
          {rejected}
        </span>
      )}
    </Link>
  )
}
