import { KeyRound, ShieldAlert } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"

export function ProviderActionButtons({
  onSaveSettings,
  onOpenSecretDialog,
  onCheck,
  isPending,
  isChecking,
}: {
  onSaveSettings: () => void
  onOpenSecretDialog: () => void
  onCheck: () => void
  isPending: boolean
  isChecking: boolean
}) {
  const { t } = useI18n()

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onSaveSettings}
        disabled={isPending}
        className="h-8 text-xs font-semibold"
      >
        {t("settings.saveSettings")}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onOpenSecretDialog}
        className="h-8 gap-1.5 text-xs font-semibold"
      >
        <KeyRound className="size-3.5" />
        <span>{t("settings.setSecret")}</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={onCheck}
        disabled={isChecking}
        className="h-8 gap-1.5 text-xs font-semibold"
      >
        <ShieldAlert className="size-3.5" />
        <span>{isChecking ? t("common.checking") : t("settings.checkProvider")}</span>
      </Button>
    </div>
  )
}
