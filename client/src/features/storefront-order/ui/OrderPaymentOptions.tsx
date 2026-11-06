import type { Control } from "react-hook-form"
import { useWatch } from "react-hook-form"
import { CreditCard, Banknote } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import type { StorefrontConfig } from "@/entities/storefront"
import type { CheckoutFormValues } from "./FulfillmentPicker"

export function OrderPaymentOptions({
  config,
  productPrice,
  deliveryFee,
  control,
  setValue,
}: {
  config?: StorefrontConfig
  productPrice?: number | null
  deliveryFee: number
  control: Control<CheckoutFormValues>
  setValue: (field: keyof CheckoutFormValues, value: any) => void
}) {
  const { t } = useI18n()
  const paymentMethod = useWatch({ control, name: "paymentMethod" })
  const onlineProvider = useWatch({ control, name: "onlineProvider" })
  const fulfillment = useWatch({ control, name: "fulfillmentMethod" })

  const providers = config?.paymentProviders ?? []
  const canPayOnline = Boolean(productPrice && productPrice > 0 && providers.length > 0)
  const total = (productPrice ?? 0) + (fulfillment === "DELIVERY" ? deliveryFee : 0)

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      {/* Price breakdown */}
      <div className="rounded-xl bg-muted/50 p-3 space-y-1.5 text-xs">
        {productPrice ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("storefront.price")}</span>
            <span className="font-mono font-medium">{formatMoney(productPrice)} so&apos;m</span>
          </div>
        ) : null}

        {fulfillment === "DELIVERY" && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("storefront.deliveryFee")}</span>
            <span className="font-mono font-medium">
              {deliveryFee === 0 ? t("storefront.deliveryFree") : `${formatMoney(deliveryFee)} so'm`}
            </span>
          </div>
        )}

        {productPrice ? (
          <div className="flex justify-between pt-1 border-t border-border font-semibold text-sm">
            <span>{t("storefront.total")}</span>
            <span className="font-mono text-primary">{formatMoney(total)} so&apos;m</span>
          </div>
        ) : null}
      </div>

      {canPayOnline && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold">{t("storefront.paymentMethod")}</Label>
          <div className="grid grid-cols-1 gap-2">
            <Button
              type="button"
              variant={paymentMethod === "ON_RECEIPT" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setValue("paymentMethod", "ON_RECEIPT")
                setValue("onlineProvider", "")
              }}
              className="justify-start gap-2 h-9 text-xs"
            >
              <Banknote className="size-4 shrink-0" />
              <span>{t("storefront.payOnReceipt")}</span>
            </Button>

            {providers.map((p) => (
              <Button
                key={p.code}
                type="button"
                variant={
                  paymentMethod === "ONLINE" && onlineProvider === p.code
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => {
                  setValue("paymentMethod", "ONLINE")
                  setValue("onlineProvider", p.code)
                }}
                className="justify-start gap-2 h-9 text-xs"
              >
                <CreditCard className="size-4 shrink-0" />
                <span>{t("storefront.payWithProvider", { provider: p.label || p.code })}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
