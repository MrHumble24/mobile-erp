import { useI18n } from "@/shared/i18n"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"

export function ProviderFields({
  providerCode,
  settings,
  onChange,
  disabled,
}: {
  providerCode: string
  settings: Record<string, string>
  onChange: (key: string, value: string) => void
  disabled: boolean
}) {
  const { t } = useI18n()

  if (providerCode === "PAYME") {
    return (
      <div className="space-y-1">
        <Label className="text-xs font-semibold">{t("settings.paymeMerchantId")}</Label>
        <Input
          value={settings.merchantId ?? ""}
          onChange={(e) => onChange("merchantId", e.target.value)}
          placeholder="payme-merchant-id"
          disabled={disabled}
        />
      </div>
    )
  }

  if (providerCode === "CLICK") {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">{t("settings.clickServiceId")}</Label>
          <Input
            value={settings.serviceId ?? ""}
            onChange={(e) => onChange("serviceId", e.target.value)}
            placeholder="click-service-id"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold">{t("settings.clickMerchantId")}</Label>
          <Input
            value={settings.merchantId ?? ""}
            onChange={(e) => onChange("merchantId", e.target.value)}
            placeholder="click-merchant-id"
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  return null
}
