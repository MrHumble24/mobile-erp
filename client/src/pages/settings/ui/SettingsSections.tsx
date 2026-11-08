import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { FormDescription, FormItem, FormLabel } from "@/shared/ui/form"
import type { SettingsForm } from "../model/settings-form.types"
import { Field } from "./Field"
import { Section } from "./Section"
import { SwitchField } from "./SwitchField"

export { DiscountsSection } from "./DiscountsSection"

export function StoreIdentitySection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("settings.sectionIdentity")}
      description={t("settings.sectionIdentityDesc")}
    >
      <Field
        form={form}
        name="storeName"
        label={t("settings.storeName")}
        disabled={disabled}
      />
      <Field
        form={form}
        name="storePhone"
        label={t("settings.storePhone")}
        disabled={disabled}
      />
      <Field
        form={form}
        name="storeAddress"
        label={t("settings.storeAddress")}
        type="textarea"
        disabled={disabled}
      />
      <Field
        form={form}
        name="receiptFooter"
        label={t("settings.receiptFooter")}
        type="textarea"
        disabled={disabled}
      />
    </Section>
  )
}

export function SalesSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("settings.sectionSales")}
      description={t("settings.sectionSalesDesc")}
    >
      <Field
        form={form}
        name="defaultWarrantyDays"
        label={t("settings.defaultWarrantyDays")}
        type="number"
        suffix="kun"
        disabled={disabled}
      />
      <Field
        form={form}
        name="minMarginPercent"
        label={t("settings.minMarginPercent")}
        type="number"
        suffix="%"
        disabled={disabled}
      />
      <Field
        form={form}
        name="lowStockThreshold"
        label={t("settings.lowStockThreshold")}
        type="number"
        suffix="dona"
        disabled={disabled}
      />
      <FormItem className="p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 space-y-0">
        <div className="space-y-0.5">
          <FormLabel className="text-sm font-medium text-foreground">
            {t("settings.currency")}
          </FormLabel>
          <FormDescription className="text-xs text-muted-foreground">
            {t("settings.currencyFixed")}
          </FormDescription>
        </div>
        <div className="sm:w-60 shrink-0">
          <Input value="USD" disabled readOnly className="h-9 text-sm font-mono" />
        </div>
      </FormItem>
    </Section>
  )
}

export function NasiyaSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("settings.sectionNasiya")}
      description={t("settings.sectionNasiyaDesc")}
    >
      <Field
        form={form}
        name="defaultNasiyaDueDays"
        label={t("settings.defaultNasiyaDueDays")}
        type="number"
        suffix="kun"
        disabled={disabled}
      />
      <Field
        form={form}
        name="overdueReminderDays"
        label={t("settings.overdueReminderDays")}
        type="number"
        suffix="kun"
        disabled={disabled}
      />
    </Section>
  )
}

export function CustomerCreditSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("credit.settingsTitle")}
      description={t("credit.pageDescription")}
      footer={t("credit.noInterest")}
    >
      <SwitchField
        form={form}
        name="customerCreditEnabled"
        label={t("credit.settingsEnabled")}
        disabled={disabled}
      />
      <Field
        form={form}
        name="defaultCreditLimit"
        label={t("credit.settingsDefaultLimit")}
        type="number"
        suffix="USD"
        disabled={disabled}
        placeholder={t("credit.noLimit")}
      />
    </Section>
  )
}

export function ShiftsSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("shifts.settingsTitle")}
      description={t("shifts.settingsHint")}
    >
      <SwitchField
        form={form}
        name="shiftsEnabled"
        label={t("shifts.settingsEnabled")}
        disabled={disabled}
      />
    </Section>
  )
}

export function RepairsSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("repairs.settingsTitle")}
      description={t("repairs.settingsHint")}
    >
      <SwitchField
        form={form}
        name="repairsEnabled"
        label={t("repairs.settingsEnabled")}
        disabled={disabled}
      />
    </Section>
  )
}

export function TelegramSection({
  form,
  disabled,
}: {
  form: SettingsForm
  disabled: boolean
}) {
  const { t } = useI18n()
  return (
    <Section
      title={t("settings.sectionTelegram")}
      description={t("settings.sectionTelegramDesc")}
    >
      <Field
        form={form}
        name="telegramChatId"
        label={t("settings.telegramChatId")}
        disabled={disabled}
        placeholder="-1001234567890"
      />
      <Field
        form={form}
        name="closingTime"
        label={t("settings.closingTime")}
        type="time"
        disabled={disabled}
      />
    </Section>
  )
}
