import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import { useI18n } from "@/shared/i18n"

interface StorefrontTogglesProps {
  enabled: boolean
  showPrices: boolean
  onEnabledChange: (val: boolean) => void
  onShowPricesChange: (val: boolean) => void
  disabled: boolean
}

export function StorefrontToggles({
  enabled,
  showPrices,
  onEnabledChange,
  onShowPricesChange,
  disabled,
}: StorefrontTogglesProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="storefront-enabled" className="text-xs font-semibold">
          {t("settings.storefrontEnabled")}
        </Label>
        <Switch
          id="storefront-enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor="storefront-show-prices"
          className="text-xs font-semibold"
        >
          {t("settings.storefrontShowPrices")}
        </Label>
        <Switch
          id="storefront-show-prices"
          checked={showPrices}
          onCheckedChange={onShowPricesChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
