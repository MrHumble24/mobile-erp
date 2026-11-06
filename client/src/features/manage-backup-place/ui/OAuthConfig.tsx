import { Copy, LinkIcon, UserCircle2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import {
  useBackupRedirectUri,
  useOauthStart,
  backupErrorMessage,
  type PlaceView,
} from "@/entities/backup"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { toast } from "@/shared/ui/sonner"
import { SecretField } from "./SecretField"

export function OAuthConfig({ place }: { place: PlaceView }) {
  const { t } = useI18n()
  const { data: redirect } = useBackupRedirectUri(place.code, true)
  const start = useOauthStart()

  const connect = () =>
    start.mutate(
      { code: place.code, returnTo: window.location.href },
      {
        onSuccess: ({ url }) => {
          window.location.href = url
        },
        onError: (err: Error) => toast.error(backupErrorMessage(err, t)),
      },
    )

  const copyRedirect = () => {
    if (!redirect?.redirectUri) return
    navigator.clipboard?.writeText(redirect.redirectUri)
    toast.success(t("backups.redirectCopied"))
  }

  return (
    <div className="space-y-3">
      <SecretField code={place.code} kind="clientId" label={t("backups.clientIdLabel")} />
      <SecretField code={place.code} kind="clientSecret" label={t("backups.clientSecretLabel")} />

      <div className="space-y-1.5">
        <label className="text-xs font-semibold flex items-center gap-1.5">
          <LinkIcon className="size-3.5" />
          {t("backups.redirectUriLabel")}
        </label>
        <div className="flex gap-2">
          <Input readOnly value={redirect?.redirectUri ?? ""} className="h-8 text-xs font-mono" />
          <Button
            type="button"
            variant="outline"
            className="h-8 text-xs shrink-0"
            onClick={copyRedirect}
            disabled={!redirect?.redirectUri}
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("backups.redirectNote")}</p>
      </div>

      {place.connected && (place.settings.accountEmail || place.settings.accountName) && (
        <div className="flex items-center gap-1.5 text-xs text-foreground">
          <UserCircle2 className="size-4 text-emerald-600" />
          {place.settings.accountEmail ?? place.settings.accountName}
        </div>
      )}

      <Button
        type="button"
        className="h-8 text-xs"
        disabled={!place.configured || start.isPending}
        onClick={connect}
      >
        {place.connected ? t("backups.reconnect") : t("backups.connect")}
      </Button>
      {!place.configured && (
        <p className="text-[11px] text-muted-foreground">{t("backups.connectNeedsClient")}</p>
      )}
    </div>
  )
}
