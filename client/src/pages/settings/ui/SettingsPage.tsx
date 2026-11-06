import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import {
  useSettings,
  useUpdateSettings,
  type StoreSettings,
} from "@/entities/settings"
import { formatDateTime } from "@/shared/lib/format"
import { PageHeader } from "@/shared/ui/page-header"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { Skeleton } from "@/shared/ui/skeleton"
import { toast } from "@/shared/ui/sonner"
import {
  settingsSchema,
  toFormValues,
  toUpdateDto,
  type SettingsValues,
} from "../model/settings-schema"
import {
  StoreIdentitySection,
  SalesSection,
  DiscountsSection,
  CustomerCreditSection,
  NasiyaSection,
  ShiftsSection,
  RepairsSection,
  TelegramSection,
} from "./SettingsSections"
import { BonusSection } from "./BonusSection"
import { PrintingSection } from "./PrintingSection"
import { CompanySection } from "./CompanySection"
import { StorefrontSection } from "./StorefrontSection"
import { StorefrontDeliverySection } from "./StorefrontDeliverySection"
import { StorefrontPaymentSection } from "./StorefrontPaymentSection"

function SettingsForm({
  settings,
  canManage,
}: {
  settings: StoreSettings
  canManage: boolean
}) {
  const { t } = useI18n()
  const update = useUpdateSettings()
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: toFormValues(settings),
  })
  const disabled = !canManage

  const onSubmit = (values: SettingsValues) =>
    update.mutate(toUpdateDto(values), {
      onSuccess: () => {
        toast.success(t("settings.settingsSaved"))
        form.reset(values)
      },
      onError: (err: Error) => toast.error(err.message || t("common.error")),
    })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {t("settings.lastUpdated")}: {formatDateTime(settings.updatedAt)}
          </span>
          {canManage && form.formState.isDirty && (
            <Badge variant="violet">{t("settings.unsaved")}</Badge>
          )}
        </div>
        <StoreIdentitySection form={form} disabled={disabled} />
        <SalesSection form={form} disabled={disabled} />
        <DiscountsSection form={form} disabled={disabled} />
        <CustomerCreditSection form={form} disabled={disabled} />
        <ShiftsSection form={form} disabled={disabled} />
        <RepairsSection form={form} disabled={disabled} />
        <BonusSection form={form} disabled={disabled} />
        <PrintingSection form={form} disabled={disabled} />
        <NasiyaSection form={form} disabled={disabled} />
        <TelegramSection form={form} disabled={disabled} />
        {canManage && (
          <Button
            type="submit"
            disabled={update.isPending || !form.formState.isDirty}
            className="h-9 rounded-full px-5 text-xs font-semibold shadow-xs"
          >
            {update.isPending ? t("settings.saving") : t("common.save")}
          </Button>
        )}
      </form>
    </Form>
  )
}

export function SettingsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<"company" | "branch">("company")
  const canManage = useAuthStore((s) => s.user?.permissions?.includes("settings.manage") ?? false)
  const { data: settings, isLoading } = useSettings()

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={t("settings.title")} description={t("settings.subtitle")} />

      <div className="flex items-center gap-2 border-b border-border pb-3">
        <Button
          variant={activeTab === "company" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("company")}
          className="rounded-full text-xs font-semibold h-8 px-4"
        >
          {t("settings.tabCompany")}
        </Button>
        <Button
          variant={activeTab === "branch" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("branch")}
          className="rounded-full text-xs font-semibold h-8 px-4"
        >
          {t("settings.tabBranch")}
        </Button>
      </div>

      {activeTab === "company" ? (
        <>
          <CompanySection disabled={!canManage} />
          <StorefrontSection disabled={!canManage} />
          <StorefrontDeliverySection disabled={!canManage} />
          <StorefrontPaymentSection disabled={!canManage} />
        </>
      ) : (
        <>
          {isLoading && <Skeleton className="h-96 rounded-[16px]" />}
          {settings && <SettingsForm settings={settings} canManage={canManage} />}
        </>
      )}
    </div>
  )
}
