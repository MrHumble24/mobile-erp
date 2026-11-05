import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { FormDescription, FormItem, FormLabel } from "@/shared/ui/form"
import type { SettingsForm } from "../model/settings-form.types"
import { Field } from "./Field"
import { Section } from "./Section"
import { SwitchField } from "./SwitchField"

export function StoreIdentitySection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("settings.sectionIdentity")} description={t("settings.sectionIdentityDesc")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field form={form} name="storeName" label={t("settings.storeName")} disabled={disabled} />
        <Field form={form} name="storePhone" label={t("settings.storePhone")} disabled={disabled} />
      </div>
      <Field form={form} name="storeAddress" label={t("settings.storeAddress")} type="textarea" disabled={disabled} />
      <Field form={form} name="receiptFooter" label={t("settings.receiptFooter")} type="textarea" disabled={disabled} />
    </Section>
  )
}

export function SalesSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("settings.sectionSales")} description={t("settings.sectionSalesDesc")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field form={form} name="defaultWarrantyDays" label={t("settings.defaultWarrantyDays")} type="number" disabled={disabled} />
        <Field form={form} name="minMarginPercent" label={t("settings.minMarginPercent")} type="number" disabled={disabled} />
        <Field form={form} name="lowStockThreshold" label={t("settings.lowStockThreshold")} type="number" disabled={disabled} />
      </div>
      <FormItem>
        <FormLabel className="text-xs font-semibold">{t("settings.currency")}</FormLabel>
        <Input value="USD" disabled readOnly />
        <FormDescription>{t("settings.currencyFixed")}</FormDescription>
      </FormItem>
    </Section>
  )
}

export function NasiyaSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("settings.sectionNasiya")} description={t("settings.sectionNasiyaDesc")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field form={form} name="defaultNasiyaDueDays" label={t("settings.defaultNasiyaDueDays")} type="number" disabled={disabled} />
        <Field form={form} name="overdueReminderDays" label={t("settings.overdueReminderDays")} type="number" disabled={disabled} />
      </div>
    </Section>
  )
}

export function DiscountsSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("pricing.settingsTitle")} description={t("pricing.standingDiscountHint")}>
      <SwitchField form={form} name="discountsEnabled" label={t("pricing.settingsEnabled")} disabled={disabled} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SwitchField form={form} name="discountPercentAllowed" label={t("pricing.settingsPercent")} disabled={disabled} />
        <SwitchField form={form} name="discountAmountAllowed" label={t("pricing.settingsAmount")} disabled={disabled} />
      </div>
      <Field form={form} name="maxDiscountPercent" label={t("pricing.settingsMax")} type="number" disabled={disabled} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field form={form} name="discountPresetsPercent" label={t("pricing.settingsPresetsPercent")} disabled={disabled} placeholder="3, 5, 10" />
        <Field form={form} name="discountPresetsAmount" label={t("pricing.settingsPresetsAmount")} disabled={disabled} placeholder="50000, 100000" />
      </div>
      <p className="text-xs text-muted-foreground">{t("pricing.settingsPresetsHint")}</p>
    </Section>
  )
}

export function CustomerCreditSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("credit.settingsTitle")} description={t("credit.pageDescription")}>
      <SwitchField form={form} name="customerCreditEnabled" label={t("credit.settingsEnabled")} disabled={disabled} />
      <Field
        form={form}
        name="defaultCreditLimit"
        label={t("credit.settingsDefaultLimit")}
        type="number"
        disabled={disabled}
        placeholder={t("credit.noLimit")}
      />
      <p className="text-xs text-muted-foreground">{t("credit.noInterest")}</p>
    </Section>
  )
}

export function ShiftsSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("shifts.settingsTitle")} description={t("shifts.settingsHint")}>
      <SwitchField form={form} name="shiftsEnabled" label={t("shifts.settingsEnabled")} disabled={disabled} />
    </Section>
  )
}

export function RepairsSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("repairs.settingsTitle")} description={t("repairs.settingsHint")}>
      <SwitchField form={form} name="repairsEnabled" label={t("repairs.settingsEnabled")} disabled={disabled} />
    </Section>
  )
}

export function TelegramSection({ form, disabled }: { form: SettingsForm; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("settings.sectionTelegram")} description={t("settings.sectionTelegramDesc")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field form={form} name="telegramChatId" label={t("settings.telegramChatId")} disabled={disabled} placeholder="-1001234567890" />
        <Field form={form} name="closingTime" label={t("settings.closingTime")} type="time" disabled={disabled} />
      </div>
    </Section>
  )
}
