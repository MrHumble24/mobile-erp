import * as React from "react"
import { Check, Copy } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { httpErrorCode } from "@/shared/api/http"
import {
  type OnlinePaymentProviderConfig,
  useUpdateOnlinePaymentProvider,
  useSetOnlinePaymentSecret,
  useCheckOnlinePaymentProvider,
} from "@/entities/online-payment"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import { toast } from "@/shared/ui/sonner"
import { ProviderSecretDialog } from "./ProviderSecretDialog"
import { ProviderFields } from "./ProviderFields"
import { ProviderActionButtons } from "./ProviderActionButtons"

function useProviderActions(config: OnlinePaymentProviderConfig) {
  const { t } = useI18n()
  const updateProvider = useUpdateOnlinePaymentProvider()
  const setSecretMutation = useSetOnlinePaymentSecret()
  const checkMutation = useCheckOnlinePaymentProvider()

  const handleToggle = (enabled: boolean, settings: Record<string, string>) => {
    updateProvider.mutate(
      { code: config.providerCode, dto: { isEnabled: enabled, settings } },
      {
        onSuccess: () => toast.success(t("settings.providerSaved")),
        onError: (err: unknown) => {
          const code = httpErrorCode(err)
          if (code === "ONLINE_PAYMENT_CURRENCY_NOT_UZS") {
            toast.error(t("settings.onlinePaymentCurrencyNotUzs"))
          } else {
            toast.error((err as { message?: string })?.message || t("common.error"))
          }
        },
      },
    )
  }

  const handleSaveSecret = (secret: string, onSuccess: () => void) => {
    setSecretMutation.mutate(
      { code: config.providerCode, secret },
      {
        onSuccess: () => {
          toast.success(t("settings.secretSaved"))
          onSuccess()
        },
        onError: () => toast.error(t("common.error")),
      },
    )
  }

  const handleCheck = () => {
    checkMutation.mutate(config.providerCode, {
      onSuccess: (res) => toast.success(res.message || t("settings.providerValid")),
      onError: (err: unknown) => {
        toast.error((err as { message?: string })?.message || t("settings.providerInvalid"))
      },
    })
  }

  return { updateProvider, setSecretMutation, checkMutation, handleToggle, handleSaveSecret, handleCheck }
}

export function PaymentProviderCard({
  config,
  disabled,
}: {
  config: OnlinePaymentProviderConfig
  disabled: boolean
}) {
  const { t } = useI18n()
  const { updateProvider, setSecretMutation, checkMutation, handleToggle, handleSaveSecret, handleCheck } =
    useProviderActions(config)

  const [secretDialogOpen, setSecretDialogOpen] = React.useState(false)
  const [secretInput, setSecretInput] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [settings, setSettings] = React.useState<Record<string, string>>(() => {
    const s = config.settings ?? {}
    return { merchantId: String(s.merchantId ?? ""), serviceId: String(s.serviceId ?? "") }
  })

  React.useEffect(() => {
    const s = config.settings ?? {}
    setSettings({ merchantId: String(s.merchantId ?? ""), serviceId: String(s.serviceId ?? "") })
  }, [config.settings])

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin.replace(/:\d+$/, ":3175")}/online-payments/callback/${config.providerCode.toLowerCase()}`
      : `/online-payments/callback/${config.providerCode.toLowerCase()}`

  const copyCallback = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl)
      setCopied(true)
      toast.success(t("settings.callbackUrlCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.info(callbackUrl)
    }
  }

  const badgeVariant = config.secretStatus === "set" ? "default" : config.secretStatus === "missing" ? "outline" : "destructive"

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{config.label}</span>
          <Badge variant={badgeVariant} className="text-[10px] px-2 py-0.5">
            {t(`settings.secret${config.secretStatus.charAt(0).toUpperCase() + config.secretStatus.slice(1)}` as any)}
          </Badge>
        </div>
        <Switch
          checked={config.isEnabled}
          onCheckedChange={(checked) => handleToggle(checked, settings)}
          disabled={disabled || updateProvider.isPending}
        />
      </div>

      <div className="p-2.5 rounded-lg bg-muted text-xs font-mono flex items-center justify-between gap-2">
        <span className="truncate">{callbackUrl}</span>
        <Button type="button" size="icon" variant="ghost" onClick={copyCallback} className="size-7 shrink-0">
          {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Label className="text-xs font-semibold">{t("settings.testMode")}</Label>
        <Switch
          checked={config.isTestMode}
          onCheckedChange={(isTestMode) =>
            updateProvider.mutate({ code: config.providerCode, dto: { isTestMode } })
          }
          disabled={disabled || updateProvider.isPending}
        />
      </div>

      <ProviderFields
        providerCode={config.providerCode}
        settings={settings}
        onChange={(k, v) => setSettings((prev) => ({ ...prev, [k]: v }))}
        disabled={disabled}
      />

      {!disabled && (
        <ProviderActionButtons
          onSaveSettings={() =>
            updateProvider.mutate(
              { code: config.providerCode, dto: { settings } },
              { onSuccess: () => toast.success(t("settings.providerSaved")), onError: () => toast.error(t("common.error")) },
            )
          }
          onOpenSecretDialog={() => setSecretDialogOpen(true)}
          onCheck={handleCheck}
          isPending={updateProvider.isPending}
          isChecking={checkMutation.isPending}
        />
      )}

      <ProviderSecretDialog
        open={secretDialogOpen}
        onOpenChange={setSecretDialogOpen}
        secretInput={secretInput}
        setSecretInput={setSecretInput}
        onSave={() => handleSaveSecret(secretInput.trim(), () => { setSecretDialogOpen(false); setSecretInput(""); })}
        isPending={setSecretMutation.isPending}
      />
    </div>
  )
}
