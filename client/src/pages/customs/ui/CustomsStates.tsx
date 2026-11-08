import { Plus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button, buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"

/** First-run state: explains the three steps and offers the first real action. */
export function CustomsEmptyState({ canManage }: { canManage: boolean }) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{t("customs.emptyTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("customs.emptyBody")}</p>
      {canManage ? (
        <>
          <ol className="mt-3 list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>{t("customs.emptyStep1")}</li>
            <li>{t("customs.emptyStep2")}</li>
            <li>{t("customs.emptyStep3")}</li>
          </ol>
          <Link
            to="/customs/new"
            className={buttonVariants({ className: "mt-4 gap-1.5" })}
          >
            <Plus className="size-4" />
            {t("customs.emptyAction")}
          </Link>
        </>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("customs.emptyNoPermission")}
        </p>
      )}
    </div>
  )
}

/** A failed query is never shown as an empty list — name the failure and offer recovery. */
export function CustomsLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm font-semibold">{t("customs.loadError")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("customs.loadErrorHint")}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        {t("common.retry")}
      </Button>
    </div>
  )
}

/** Compact inline variant for the secondary lists on the page. */
export function CustomsInlineError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  return (
    <p className="text-xs text-destructive">
      {t("customs.loadError")}.{" "}
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
