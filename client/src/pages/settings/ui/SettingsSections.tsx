import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Switch } from "@/shared/ui/switch"
import { Textarea } from "@/shared/ui/textarea"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form"
import type { SettingsValues } from "../model/settings-schema"

type Form = UseFormReturn<SettingsValues>

/** Keys of SettingsValues whose value is a string (the text/number fields). */
type StringFieldName = {
  [K in keyof SettingsValues]: SettingsValues[K] extends string ? K : never
}[keyof SettingsValues]

type FieldType = "text" | "number" | "time" | "textarea"

function Field({
  form,
  name,
  label,
  type = "text",
  disabled,
  placeholder,
}: {
  form: Form
  name: StringFieldName
  label: string
  type?: FieldType
  disabled: boolean
  placeholder?: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold">{label}</FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea {...field} disabled={disabled} placeholder={placeholder} />
            ) : (
              <Input
                {...field}
                type={type === "number" ? "number" : type === "time" ? "time" : "text"}
                disabled={disabled}
                placeholder={placeholder}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/** A boolean switch bound to a form field. */
function SwitchField({
  form,
  name,
  label,
  disabled,
}: {
  form: Form
  name:
    | "discountsEnabled"
    | "discountPercentAllowed"
    | "discountAmountAllowed"
    | "customerCreditEnabled"
    | "shiftsEnabled"
  label: string
  disabled: boolean
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-3 space-y-0">
          <FormLabel className="text-xs font-semibold">{label}</FormLabel>
          <FormControl>
            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={disabled} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

export function StoreIdentitySection({ form, disabled }: { form: Form; disabled: boolean }) {
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

export function SalesSection({ form, disabled }: { form: Form; disabled: boolean }) {
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

export function NasiyaSection({ form, disabled }: { form: Form; disabled: boolean }) {
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

export function DiscountsSection({ form, disabled }: { form: Form; disabled: boolean }) {
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

export function CustomerCreditSection({ form, disabled }: { form: Form; disabled: boolean }) {
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

export function ShiftsSection({ form, disabled }: { form: Form; disabled: boolean }) {
  const { t } = useI18n()
  return (
    <Section title={t("shifts.settingsTitle")} description={t("shifts.settingsHint")}>
      <SwitchField form={form} name="shiftsEnabled" label={t("shifts.settingsEnabled")} disabled={disabled} />
    </Section>
  )
}

export function TelegramSection({ form, disabled }: { form: Form; disabled: boolean }) {
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
