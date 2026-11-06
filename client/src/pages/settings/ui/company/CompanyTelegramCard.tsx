import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Button,
  Badge,
  toast,
} from "@/shared/ui"
import { useI18n } from "@/shared/i18n"
import {
  useTelegramStatus,
  useUpdateTelegramToken,
  useTestTelegram,
} from "@/entities/company"

interface CompanyTelegramCardProps {
  disabled: boolean
}

export function CompanyTelegramCard({ disabled }: CompanyTelegramCardProps) {
  const { t } = useI18n()
  const { data: telegram } = useTelegramStatus()
  const updateToken = useUpdateTelegramToken()
  const testTelegram = useTestTelegram()
  const [tokenInput, setTokenInput] = useState("")

  const handleUpdateToken = () => {
    if (!tokenInput.trim()) return
    updateToken.mutate(tokenInput.trim(), {
      onSuccess: () => {
        toast.success(t("settings.settingsSaved"))
        setTokenInput("")
      },
      onError: (err: Error) => toast.error(err.message || t("common.error")),
    })
  }

  const handleSendTest = () => {
    testTelegram.mutate(undefined, {
      onSuccess: () => toast.success(t("settings.testSent")),
      onError: (err: Error) => toast.error(err.message || t("settings.testFailed")),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("settings.sectionTelegram")}</CardTitle>
        <CardDescription className="text-xs">{t("setup.telegramSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium">{t("settings.telegramToken")}:</span>
          {telegram?.isTokenSet ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
              {t("settings.telegramTokenSet")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              {t("settings.telegramTokenNotSet")}
            </Badge>
          )}
        </div>

        {!disabled && (
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder={t("settings.telegramTokenPlaceholder")}
              className="max-w-md h-9"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUpdateToken}
              disabled={updateToken.isPending || !tokenInput.trim()}
              className="h-9 rounded-full px-4 text-xs"
            >
              {t("settings.updateToken")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendTest}
              disabled={testTelegram.isPending || !telegram?.isTokenSet}
              className="h-9 rounded-full px-4 text-xs"
            >
              {testTelegram.isPending ? "Testing..." : t("settings.sendTest")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
