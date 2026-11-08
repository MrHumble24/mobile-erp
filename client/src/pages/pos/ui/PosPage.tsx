import { Wrench } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useSettings } from "@/entities/settings"
import { PosTerminal } from "@/widgets/pos-terminal"
import { Link } from "@/shared/ui/link"
import { buttonVariants } from "@/shared/ui/button"

export function PosPage() {
  const { t } = useI18n()
  const settings = useSettings()
  const canOpenRepairs =
    useAuthStore((s) => s.hasPermission("repair.read")) &&
    Boolean(settings.data?.repairsEnabled)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("pos.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("pos.scanPrompt")}
          </p>
        </div>
        {canOpenRepairs && (
          <Link to="/repairs" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}>
            <Wrench className="size-4" />
            {t("pos.openRepairs")}
          </Link>
        )}
      </div>

      <PosTerminal />
    </div>
  )
}
