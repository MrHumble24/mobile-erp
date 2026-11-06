import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { Copy, Check, ExternalLink } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useStorefrontSettings, useUpdateStorefrontSettings } from "@/entities/storefront"
import { useProductCategories } from "@/entities/product-category"
import { Section } from "./Section"
import { Switch } from "@/shared/ui/switch"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/sonner"

interface StorefrontFormValues {
  enabled: boolean
  showPrices: boolean
  contactPhone: string
  contactTelegram: string
  categoryIds: string[]
}

export function StorefrontSection({ disabled }: { disabled: boolean }) {
  const { t } = useI18n()
  const { data: settings, isLoading } = useStorefrontSettings()
  const updateSettings = useUpdateStorefrontSettings()
  const { data: categories } = useProductCategories()

  const [copied, setCopied] = React.useState(false)

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

  const enabledValue = useWatch({ control: form.control, name: "enabled" })
  const showPricesValue = useWatch({ control: form.control, name: "showPrices" })
  const categoryIdsValue = useWatch({ control: form.control, name: "categoryIds" })

  const storefrontUrl = typeof window !== "undefined" ? `${window.location.origin}/shop` : "/shop"

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl)
      setCopied(true)
      toast.success(t("settings.storefrontUrlCopied"))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      toast.info(storefrontUrl)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const current = form.getValues("categoryIds") || []
    const next = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]
    form.setValue("categoryIds", next, { shouldDirty: true })
  }

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
          toast.error((err as { message?: string })?.message || t("common.error"))
        },
      }
    )
  }

  if (isLoading) {
    return (
      <Section title={t("settings.sectionStorefront")} description={t("settings.sectionStorefrontDesc")}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </Section>
    )
  }

  return (
    <Section title={t("settings.sectionStorefront")} description={t("settings.sectionStorefrontDesc")}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Public URL display */}
        <div className="p-3.5 rounded-xl bg-muted border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs font-semibold text-muted-foreground block">
              {t("settings.storefrontUrl")}
            </span>
            <span className="font-mono text-xs text-foreground truncate block">
              {storefrontUrl}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyUrl}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>{copied ? t("common.copied") : t("settings.copyStorefrontUrl")}</span>
            </Button>
            <a
              href="/shop"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center size-8 rounded-full border border-border hover:bg-muted transition-colors"
            >
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Enabled toggle */}
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="storefront-enabled" className="text-xs font-semibold">
            {t("settings.storefrontEnabled")}
          </Label>
          <Switch
            id="storefront-enabled"
            checked={enabledValue}
            onCheckedChange={(checked) => form.setValue("enabled", checked, { shouldDirty: true })}
            disabled={disabled}
          />
        </div>

        {/* Show prices toggle */}
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="storefront-show-prices" className="text-xs font-semibold">
            {t("settings.storefrontShowPrices")}
          </Label>
          <Switch
            id="storefront-show-prices"
            checked={showPricesValue}
            onCheckedChange={(checked) => form.setValue("showPrices", checked, { shouldDirty: true })}
            disabled={disabled}
          />
        </div>

        {/* Contact phone */}
        <div className="space-y-1">
          <Label htmlFor="storefront-phone" className="text-xs font-semibold">
            {t("settings.storefrontPhone")}
          </Label>
          <Input
            id="storefront-phone"
            {...form.register("contactPhone")}
            placeholder="+998 90 123 45 67"
            disabled={disabled}
          />
        </div>

        {/* Contact Telegram */}
        <div className="space-y-1">
          <Label htmlFor="storefront-telegram" className="text-xs font-semibold">
            {t("settings.storefrontTelegram")}
          </Label>
          <Input
            id="storefront-telegram"
            {...form.register("contactTelegram")}
            placeholder="@malikastore"
            disabled={disabled}
          />
        </div>

        {/* Categories selector */}
        {categories && categories.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-xs font-semibold">
              {t("settings.storefrontCategories")}
            </Label>
            <p className="text-[11px] text-muted-foreground">
              {categoryIdsValue.length === 0 ? t("settings.storefrontCategoriesAll") : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = categoryIdsValue.includes(cat.id)
                return (
                  <Button
                    key={cat.id}
                    type="button"
                    size="sm"
                    variant={isSelected ? "default" : "outline"}
                    disabled={disabled}
                    onClick={() => toggleCategory(cat.id)}
                    className="h-8 rounded-full text-xs font-semibold"
                  >
                    {cat.name}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {!disabled && (
          <Button
            type="submit"
            disabled={updateSettings.isPending || !form.formState.isDirty}
            className="h-9 rounded-full px-5 text-xs font-semibold shadow-xs"
          >
            {updateSettings.isPending ? t("settings.saving") : t("common.save")}
          </Button>
        )}
      </form>
    </Section>
  )
}
