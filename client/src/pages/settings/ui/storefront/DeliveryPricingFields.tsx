import type { Control, UseFormRegister } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { DeliveryZonesManager } from "./DeliveryZonesManager"
import type { DeliveryTogglesValues } from "./DeliveryToggles"

export function DeliveryPricingFields({
  control,
  register,
  setValue,
  disabled,
}: {
  control: Control<DeliveryTogglesValues>
  register: UseFormRegister<DeliveryTogglesValues>
  setValue: (name: keyof DeliveryTogglesValues, value: any) => void
  disabled: boolean
}) {
  const { t } = useI18n()
  const pricingMode = useWatch({ control, name: "deliveryPricingModeCode" })

  return (
    <div className="space-y-4 pt-3 border-t border-border">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.pricingMode")}</Label>
        <Select
          value={pricingMode}
          onValueChange={(v) => setValue("deliveryPricingModeCode", v)}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("settings.pricingModePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">{t("settings.pricingModeFree")}</SelectItem>
            <SelectItem value="FLAT">{t("settings.pricingModeFlat")}</SelectItem>
            <SelectItem value="BY_ZONE">{t("settings.pricingModeByZone")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pricingMode === "FLAT" && (
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">{t("settings.flatFee")}</Label>
          <Input
            type="number"
            {...register("deliveryFlatFee")}
            placeholder="30000"
            disabled={disabled}
          />
        </div>
      )}

      {pricingMode === "BY_ZONE" && <DeliveryZonesManager disabled={disabled} />}

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.freeFrom")}</Label>
        <Input
          type="number"
          {...register("deliveryFreeFrom")}
          placeholder="5000000"
          disabled={disabled}
        />
        <p className="text-[11px] text-muted-foreground">{t("settings.freeFromDesc")}</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold">{t("settings.deliveryNote")}</Label>
        <Textarea
          {...register("deliveryNote")}
          placeholder={t("settings.deliveryNotePlaceholder")}
          disabled={disabled}
          rows={2}
        />
      </div>
    </div>
  )
}
