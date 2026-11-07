import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"

/** A failed repair query is never shown as an empty list. Names the failure and
 *  offers a retry; the compact form sits inside sheets and tabs. */
export function RepairLoadError({
  onRetry,
  compact = false,
}: {
  onRetry: () => void
  compact?: boolean
}) {
  const { t } = useI18n()
  if (compact) {
    return (
      <p className="text-xs text-destructive">
        {t("repairs.loadError")}.{" "}
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs underline underline-offset-2"
          onClick={onRetry}
        >
          {t("common.retry")}
        </Button>
      </p>
    )
  }
  return (
    <div className="rounded-[16px] border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-semibold">{t("repairs.loadError")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("repairs.loadErrorHint")}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  )
}
