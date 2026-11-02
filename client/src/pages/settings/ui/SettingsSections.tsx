import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
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
  name: keyof SettingsValues
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
