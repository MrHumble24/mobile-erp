import { useI18n } from "@/shared/i18n"
import { PosTerminal } from "@/widgets/pos-terminal"

export function PosPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{t("pos.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("pos.scanPrompt")}
        </p>
      </div>

      <PosTerminal />
    </div>
  )
}
