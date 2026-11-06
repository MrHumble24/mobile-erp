import { HardDrive, Send, Cloud, Lock } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime } from "@/shared/lib/format"
import {
  useSetPlaceEnabled,
  useTestPlace,
  useDisconnectPlace,
  backupErrorMessage,
  type PlaceView,
} from "@/entities/backup"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Switch } from "@/shared/ui/switch"
import { toast } from "@/shared/ui/sonner"
import { placeKind, PLACE_STATUS_BADGE } from "../model/place-ui"
import { TelegramConfig } from "./TelegramConfig"
import { OAuthConfig } from "./OAuthConfig"

const ICON = { local: HardDrive, telegram: Send, oauth: Cloud } as const

export function PlaceCard({ place, canManage }: { place: PlaceView; canManage: boolean }) {
  const { t } = useI18n()
  const setEnabled = useSetPlaceEnabled()
  const test = useTestPlace()
  const disconnect = useDisconnectPlace()
  const kind = placeKind(place)
  const Icon = ICON[kind]
  const badge = PLACE_STATUS_BADGE[place.status] ?? PLACE_STATUS_BADGE.NEVER_USED

  const onToggle = (enabled: boolean) =>
    setEnabled.mutate(
      { code: place.code, enabled },
      { onError: (err: Error) => toast.error(backupErrorMessage(err, t)) },
    )

  const onTest = () =>
    test.mutate(place.code, {
      onSuccess: (p) =>
        p.status === "OK"
          ? toast.success(t("backups.testOk"))
          : toast.error(p.lastError || t("backups.testFailed")),
      onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
    })

  const onDisconnect = () =>
    disconnect.mutate(place.code, {
      onSuccess: () => toast.success(t("backups.disconnected")),
      onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
    })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="size-4" />
            {place.label}
          </CardTitle>
          {place.available ? (
            <Badge variant={badge.variant} size="sm">
              {t(badge.key)}
            </Badge>
          ) : (
            <Badge variant="mercury" size="sm">
              {t("backups.placeUnavailable")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t(`backups.placeDesc_${place.code}`)}</p>

        {place.lastSuccessAt && (
          <p className="text-[11px] text-muted-foreground">
            {t("backups.lastSuccess")}: {formatDateTime(place.lastSuccessAt)}
          </p>
        )}
        {place.lastError && (
          <p className="text-[11px] text-destructive">
            {t("backups.lastError")}: {place.lastError}
          </p>
        )}

        {place.locked ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" />
            {t("backups.alwaysOn")}
          </p>
        ) : (
          place.available && (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold">{t("backups.placeEnabledLabel")}</span>
                <Switch
                  checked={place.enabled}
                  onCheckedChange={onToggle}
                  disabled={!canManage || setEnabled.isPending}
                />
              </div>

              {canManage && (
                <>
                  {kind === "telegram" && <TelegramConfig place={place} />}
                  {kind === "oauth" && <OAuthConfig place={place} />}

                  <div className="flex gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={test.isPending}
                      onClick={onTest}
                    >
                      {t("backups.test")}
                    </Button>
                    {place.connected && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-8 text-xs text-destructive"
                        disabled={disconnect.isPending}
                        onClick={onDisconnect}
                      >
                        {t("backups.disconnect")}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )
        )}
      </CardContent>
    </Card>
  )
}
