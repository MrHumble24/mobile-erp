import { Button, Input } from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import type { WizardState, WizardUpdate } from "./types"

interface Props {
  state: WizardState
  update: WizardUpdate
  onNext: () => void
  onBack: () => void
}

export function TelegramStep({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("setup.telegramTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("setup.telegramSubtitle")}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.botToken")}</label>
        <Input
          type="password"
          value={state.telegram?.botToken || ""}
          onChange={(e) =>
            update((p) => ({ ...p, telegram: { ...p.telegram, botToken: e.target.value } }))
          }
          placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("setup.chatId")}</label>
        <Input
          value={state.telegram?.chatId || ""}
          onChange={(e) =>
            update((p) => ({ ...p, telegram: { ...p.telegram, chatId: e.target.value } }))
          }
          placeholder="-1001234567890"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="h-10 rounded-full px-6">
          {t("setup.back")}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext} className="h-10 rounded-full px-4 text-xs">
            {t("setup.skip")}
          </Button>
          <Button onClick={onNext} className="h-10 rounded-full px-6 font-semibold shadow-xs">
            {t("setup.next")}
          </Button>
        </div>
      </div>
    </div>
  )
}
