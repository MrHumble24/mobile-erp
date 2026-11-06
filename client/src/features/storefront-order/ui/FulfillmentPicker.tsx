import type { Control, UseFormRegister } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { MapPin, Store } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Label } from "@/shared/ui/label"
import { Input } from "@/shared/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { Button } from "@/shared/ui/button"
import type { StorefrontConfig } from "@/entities/storefront"

export interface CheckoutFormValues {
  name: string
  phone: string
  fulfillmentMethod: "PICKUP" | "DELIVERY"
  storeId: string
  address: string
  deliveryZoneId: string
  paymentMethod: "ON_RECEIPT" | "ONLINE"
  onlineProvider: string
  note: string
  hp: string
}

export function FulfillmentPicker({
  config,
  availableStores,
  control,
  register,
  setValue,
  hasChoice,
}: {
  config?: StorefrontConfig
  availableStores: Array<{ id: string; name: string }>
  control: Control<CheckoutFormValues>
  register: UseFormRegister<CheckoutFormValues>
  setValue: (field: keyof CheckoutFormValues, value: any) => void
  hasChoice: boolean
}) {
  const { t } = useI18n()
  const fulfillment = useWatch({ control, name: "fulfillmentMethod" })
  const storeId = useWatch({ control, name: "storeId" })
  const deliveryZoneId = useWatch({ control, name: "deliveryZoneId" })

  const zones = config?.deliveryZones?.filter((z) => z.isActive) ?? []

  return (
    <div className="space-y-3">
      {hasChoice && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
          <Button
            type="button"
            variant={fulfillment === "PICKUP" ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("fulfillmentMethod", "PICKUP")}
            className="rounded-lg text-xs gap-1.5 h-8 font-semibold"
          >
            <Store className="size-3.5" />
            <span>{t("storefront.pickup")}</span>
          </Button>
          <Button
            type="button"
            variant={fulfillment === "DELIVERY" ? "default" : "ghost"}
            size="sm"
            onClick={() => setValue("fulfillmentMethod", "DELIVERY")}
            className="rounded-lg text-xs gap-1.5 h-8 font-semibold"
          >
            <MapPin className="size-3.5" />
            <span>{t("storefront.delivery")}</span>
          </Button>
        </div>
      )}

      {fulfillment === "PICKUP" && (
        <div className="space-y-1">
          <Label htmlFor="order-store" className="text-xs font-semibold">
            {t("storefront.branch")} *
          </Label>
          <Select
            value={storeId}
            onValueChange={(val) => {
              if (val) setValue("storeId", val)
            }}
          >
            <SelectTrigger id="order-store">
              <SelectValue placeholder={t("storefront.selectBranch")} />
            </SelectTrigger>
            <SelectContent>
              {availableStores.map((st) => (
                <SelectItem key={st.id} value={st.id}>
                  {st.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {fulfillment === "DELIVERY" && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="order-address" className="text-xs font-semibold">
              {t("storefront.deliveryAddress")} *
            </Label>
            <Input
              id="order-address"
              {...register("address", { required: fulfillment === "DELIVERY" })}
              placeholder={t("storefront.deliveryAddressPlaceholder")}
              required={fulfillment === "DELIVERY"}
            />
          </div>

          {config?.deliveryPricingMode === "BY_ZONE" && (
            <div className="space-y-1">
              <Label htmlFor="order-zone" className="text-xs font-semibold">
                {t("storefront.deliveryZone")} *
              </Label>
              <Select
                value={deliveryZoneId}
                onValueChange={(val) => {
                  if (val) setValue("deliveryZoneId", val)
                }}
              >
                <SelectTrigger id="order-zone">
                  <SelectValue placeholder={t("storefront.selectZone")} />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {config?.deliveryNote && (
            <p className="text-[11px] text-muted-foreground bg-muted/60 p-2 rounded-lg">
              {config.deliveryNote}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
