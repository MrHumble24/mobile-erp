import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import {
  useStorefrontSettings,
  useUpdateStorefrontSettings,
} from "@/entities/storefront"
import { Section } from "./Section"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/sonner"
import {
  DeliveryToggles,
  type DeliveryTogglesValues,
} from "./storefront/DeliveryToggles"
import { DeliveryPricingFields } from "./storefront/DeliveryPricingFields"

function useDeliveryForm() {
  const { t } = useI18n()
  const { data: settings, isLoading } = useStorefrontSettings()
  const updateSettings = useUpdateStorefrontSettings()

  const form = useForm<DeliveryTogglesValues>({
    defaultValues: {
      pickupEnabled: true,
      deliveryEnabled: false,
      deliveryPricingModeCode: "FLAT",
      deliveryFlatFee: "30000",
      deliveryFreeFrom: "",
      deliveryNote: "",
    },
  })

  React.useEffect(() => {
    if (settings) {
      form.reset({
        pickupEnabled: settings.pickupEnabled ?? true,
        deliveryEnabled: settings.deliveryEnabled ?? false,
        deliveryPricingModeCode: settings.deliveryPricingModeCode ?? "FLAT",
        deliveryFlatFee: settings.deliveryFlatFee ?? "",
        deliveryFreeFrom: settings.deliveryFreeFrom ?? "",
        deliveryNote: settings.deliveryNote ?? "",
      })
    }
  }, [settings, form])

  const onSubmit = (values: DeliveryTogglesValues) => {
    updateSettings.mutate(
      {
        pickupEnabled: values.pickupEnabled,
        deliveryEnabled: values.deliveryEnabled,
        deliveryPricingModeCode: values.deliveryPricingModeCode,
        deliveryFlatFee: values.deliveryFlatFee ? Number(values.deliveryFlatFee) : null,
        deliveryFreeFrom: values.deliveryFreeFrom ? Number(values.deliveryFreeFrom) : null,
        deliveryNote: values.deliveryNote.trim() || null,
      },
      {
        onSuccess: () => toast.success(t("settings.settingsSaved")),
        onError: () => toast.error(t("common.error")),
      },
    )
  }

  return { form, isLoading, isPending: updateSettings.isPending, onSubmit }
}

export function StorefrontDeliverySection({ disabled }: { disabled: boolean }) {
  const { t } = useI18n()
  const { form, isLoading, isPending, onSubmit } = useDeliveryForm()
  const deliveryEnabled = useWatch({
    control: form.control,
    name: "deliveryEnabled",
  })

  if (isLoading) {
    return (
      <Section
        title={t("settings.sectionDelivery")}
        description={t("settings.sectionDeliveryDesc")}
      >
        <Skeleton className="h-8 w-full" />
      </Section>
    )
  }

  return (
    <Section
      title={t("settings.sectionDelivery")}
      description={t("settings.sectionDeliveryDesc")}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 sm:p-5 space-y-5">
        <DeliveryToggles
          control={form.control}
          setValue={form.setValue}
          disabled={disabled}
        />

        {deliveryEnabled && (
          <DeliveryPricingFields
            control={form.control}
            register={form.register}
            setValue={form.setValue}
            disabled={disabled}
          />
        )}

        {!disabled && (
          <div className="pt-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        )}
      </form>
    </Section>
  )
}
