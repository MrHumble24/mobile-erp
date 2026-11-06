import { useState } from "react"
import { Info } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useSetPlaceSettings, backupErrorMessage, type PlaceView } from "@/entities/backup"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/ui/sonner"
import { SecretField } from "./SecretField"

export function TelegramConfig({ place }: { place: PlaceView }) {
  const { t } = useI18n()
  const setSettings = useSetPlaceSettings()
  const [chatId, setChatId] = useState(place.settings.chatId ?? "")

  const saveChatId = () =>
    setSettings.mutate(
      { code: place.code, chatId },
      {
        onSuccess: () => toast.success(t("backups.chatIdSaved")),
        onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
      },
    )

  return (
    <div className="space-y-3">
      <SecretField code={place.code} kind="botToken" label={t("backups.botTokenLabel")} />
      <div className="space-y-1.5">
        <label className="text-xs font-semibold">{t("backups.chatIdLabel")}</label>
        <div className="flex gap-2">
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder={t("backups.chatIdPlaceholder")}
            className="h-8 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            className="h-8 text-xs shrink-0"
            disabled={setSettings.isPending}
            onClick={saveChatId}
          >
            {t("common.save")}
          </Button>
        </div>
      </div>
      <p className="flex gap-1.5 text-[11px] text-muted-foreground">
        <Info className="size-3.5 shrink-0 mt-0.5" />
        {t("backups.telegramNote")}
      </p>
    </div>
  )
}
