import { useI18n } from "@/shared/i18n"
import { Link } from "@/shared/ui/link"
import { buttonVariants } from "@/shared/ui/button"

/** Replaces the silent redirect to `/`: explains the optional feature is off
 *  and gives the owner the exact next action. */
export function RepairsDisabled() {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-border bg-card p-6">
      <h2 className="text-sm font-semibold">{t("repairs.disabledTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("repairs.disabled")}</p>
      <Link to="/settings" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-4" })}>
        {t("repairs.settingsLink")}
      </Link>
    </div>
  )
}
