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
import { StorefrontUrlBanner } from "./storefront/StorefrontUrlBanner"
import { StorefrontToggles } from "./storefront/StorefrontToggles"
import { StorefrontContactFields } from "./storefront/StorefrontContactFields"
import { StorefrontCategoriesPicker } from "./storefront/StorefrontCategoriesPicker"
import type { StorefrontFormValues } from "./storefront/types"

function useStorefrontForm() {
  const { t } = useI18n()
  const { data: settings, isLoading } = useStorefrontSettings()
  const updateSettings = useUpdateStorefrontSettings()

  const form = useForm<StorefrontFormValues>({
    defaultValues: {
      enabled: false,
      showPrices: true,
      contactPhone: "",
      contactTelegram: "",
      categoryIds: [],
    },
  })

  React.useEffect(() => {
    if (settings) {
      form.reset({
        enabled: settings.enabled,
        showPrices: settings.showPrices,
        contactPhone: settings.contactPhone ?? "",
        contactTelegram: settings.contactTelegram ?? "",
        categoryIds: settings.categoryIds ?? [],
      })
    }
  }, [settings, form])

  const onSubmit = (values: StorefrontFormValues) => {
    updateSettings.mutate(
      {
        enabled: values.enabled,
        showPrices: values.showPrices,
        contactPhone: values.contactPhone.trim() || null,
        contactTelegram: values.contactTelegram.trim() || null,
        categoryIds: values.categoryIds,
      },
      {
        onSuccess: (data) => {
          toast.success(t("settings.settingsSaved"))
          form.reset({
            enabled: data.enabled,
            showPrices: data.showPrices,
            contactPhone: data.contactPhone ?? "",
            contactTelegram: data.contactTelegram ?? "",
            categoryIds: data.categoryIds ?? [],
          })
        },
        onError: (err: unknown) => {
          toast.error(
            (err as { message?: string })?.message || t("common.error"),
          )
        },
      },
    )
  }

  return { form, isLoading, isPending: updateSettings.isPending, onSubmit }
}

export function StorefrontSection({ disabled }: { disabled: boolean }) {
  const { t } = useI18n()
  const { form, isLoading, isPending, onSubmit } = useStorefrontForm()

  const enabled = useWatch({ control: form.control, name: "enabled" })
  const showPrices = useWatch({ control: form.control, name: "showPrices" })
  const categoryIds = useWatch({
    control: form.control,
    name: "categoryIds",
  })

  const toggleCategory = (categoryId: string) => {
    const current = form.getValues("categoryIds") || []
    const next = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]
    form.setValue("categoryIds", next, { shouldDirty: true })
  }

  if (isLoading) {
    return (
      <Section
        title={t("settings.sectionStorefront")}
        description={t("settings.sectionStorefrontDesc")}
      >
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </Section>
    )
  }

  return (
    <Section
      title={t("settings.sectionStorefront")}
      description={t("settings.sectionStorefrontDesc")}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <StorefrontUrlBanner />
        <StorefrontToggles
          enabled={enabled}
          showPrices={showPrices}
          onEnabledChange={(val) =>
            form.setValue("enabled", val, { shouldDirty: true })
          }
          onShowPricesChange={(val) =>
            form.setValue("showPrices", val, { shouldDirty: true })
          }
          disabled={disabled}
        />
        <StorefrontContactFields register={form.register} disabled={disabled} />
        <StorefrontCategoriesPicker
          selectedCategoryIds={categoryIds}
          onToggleCategory={toggleCategory}
          disabled={disabled}
        />
        {!disabled && (
          <Button
            type="submit"
            disabled={isPending || !form.formState.isDirty}
            className="h-9 rounded-full px-5 text-xs font-semibold shadow-xs"
          >
            {isPending ? t("settings.saving") : t("common.save")}
          </Button>
        )}
      </form>
    </Section>
  )
}
