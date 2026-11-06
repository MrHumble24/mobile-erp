import type { Control } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"

export interface DeliveryTogglesValues {
  pickupEnabled: boolean
  deliveryEnabled: boolean
  deliveryPricingModeCode: string
  deliveryFlatFee: string
  deliveryFreeFrom: string
  deliveryNote: string
}

export function DeliveryToggles({
  control,
  setValue,
  disabled,
}: {
  control: Control<DeliveryTogglesValues>
  setValue: (name: keyof DeliveryTogglesValues, value: any) => void
  disabled: boolean
}) {
  const { t } = useI18n()
  const pickupEnabled = useWatch({ control, name: "pickupEnabled" })
  const deliveryEnabled = useWatch({ control, name: "deliveryEnabled" })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="text-sm font-semibold">{t("settings.pickupEnabled")}</Label>
          <p className="text-xs text-muted-foreground">{t("settings.pickupEnabledDesc")}</p>
        </div>
        <Switch
          checked={pickupEnabled}
          onCheckedChange={(v) => setValue("pickupEnabled", v)}
          disabled={disabled}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label className="text-sm font-semibold">{t("settings.deliveryEnabled")}</Label>
          <p className="text-xs text-muted-foreground">{t("settings.deliveryEnabledDesc")}</p>
        </div>
        <Switch
          checked={deliveryEnabled}
          onCheckedChange={(v) => setValue("deliveryEnabled", v)}
          disabled={disabled}
        />
      </div>
    </div>
  )
}
