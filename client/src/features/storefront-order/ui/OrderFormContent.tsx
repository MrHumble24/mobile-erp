import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { DialogFooter } from "@/shared/ui/dialog"
import type { StorefrontConfig } from "@/entities/storefront"
import { FulfillmentPicker, type CheckoutFormValues } from "./FulfillmentPicker"
import { OrderPaymentOptions } from "./OrderPaymentOptions"

export function OrderFormContent({
  form,
  config,
  availableStores,
  productPrice,
  deliveryFee,
  hasChoice,
  onSubmit,
  isSubmitting,
  errorMessage,
}: {
  form: UseFormReturn<CheckoutFormValues>
  config?: StorefrontConfig
  availableStores: Array<{ id: string; name: string }>
  productPrice?: number | null
  deliveryFee: number
  hasChoice: boolean
  onSubmit: (values: CheckoutFormValues) => void
  isSubmitting: boolean
  errorMessage: string | null
}) {
  const { t } = useI18n()

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input type="text" {...form.register("hp")} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="space-y-1">
        <Label htmlFor="order-name">{t("storefront.name")} *</Label>
        <Input id="order-name" {...form.register("name", { required: true })} placeholder={t("storefront.namePlaceholder")} required />
      </div>

      <div className="space-y-1">
        <Label htmlFor="order-phone">{t("storefront.phone")} *</Label>
        <Input id="order-phone" type="tel" {...form.register("phone", { required: true })} placeholder={t("storefront.phonePlaceholder")} required />
      </div>

      <FulfillmentPicker
        config={config}
        availableStores={availableStores}
        control={form.control}
        register={form.register}
        setValue={form.setValue}
        hasChoice={hasChoice}
      />

      <OrderPaymentOptions
        config={config}
        productPrice={productPrice}
        deliveryFee={deliveryFee}
        control={form.control}
        setValue={form.setValue}
      />

      <div className="space-y-1">
        <Label htmlFor="order-note">{t("storefront.note")}</Label>
        <Textarea id="order-note" {...form.register("note")} placeholder={t("storefront.notePlaceholder")} rows={2} />
      </div>

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {errorMessage}
        </div>
      )}

      <DialogFooter className="pt-2">
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t("storefront.submitting") : t("storefront.orderNow")}
        </Button>
      </DialogFooter>
    </form>
  )
}
