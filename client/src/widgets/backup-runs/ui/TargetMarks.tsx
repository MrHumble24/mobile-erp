import { useI18n } from "@/shared/i18n"
import type { BackupTargetView } from "@/entities/backup"

const DOT: Record<string, string> = {
  UPLOADED: "bg-emerald-500",
  PENDING: "bg-amber-400",
  FAILED: "bg-destructive",
}

const SHORT: Record<string, string> = {
  LOCAL: "LOC",
  TELEGRAM: "TG",
  GOOGLE_DRIVE: "GD",
  ONEDRIVE: "OD",
}

/** One small mark per place a run was sent to, coloured by its state; the
 * error or state reads on hover via the native title. */
export function TargetMarks({ targets }: { targets: BackupTargetView[] }) {
  const { t } = useI18n()
  if (targets.length === 0) return <span className="text-xs text-muted-foreground">-</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {targets.map((tgt) => (
        <span
          key={tgt.providerCode}
          title={tgt.error || t(`backups.targetStatus_${tgt.status}`)}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
        >
          <span className={`size-1.5 rounded-full ${DOT[tgt.status] ?? "bg-muted-foreground"}`} />
          {SHORT[tgt.providerCode] ?? tgt.providerCode}
        </span>
      ))}
    </div>
  )
}
