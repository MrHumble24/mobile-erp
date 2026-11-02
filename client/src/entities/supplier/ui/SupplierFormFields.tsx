import type { UseFormReturn } from "react-hook-form"
import { useI18n } from "@/shared/i18n"
import { Input } from "@/shared/ui/input"
import { Textarea } from "@/shared/ui/textarea"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/ui/form"
import type { SupplierFormValues } from "../model/supplier-form.schema"

type Form = UseFormReturn<SupplierFormValues>

function SupplierTextField({
  form,
  name,
  label,
}: {
  form: Form
  name: "name" | "country" | "contact"
  label: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function SupplierNotesField({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("common.notes")}</FormLabel>
          <FormControl>
            <Textarea rows={2} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/** Name/country/contact/notes fields shared by the supplier create and edit forms. */
export function SupplierFormFields({ form }: { form: Form }) {
  const { t } = useI18n()
  return (
    <div className="space-y-4">
      <SupplierTextField form={form} name="name" label={t("shipments.supplierName")} />
      <div className="grid grid-cols-2 gap-3">
        <SupplierTextField form={form} name="country" label={t("shipments.supplierCountry")} />
        <SupplierTextField form={form} name="contact" label={t("shipments.supplierContact")} />
      </div>
      <SupplierNotesField form={form} />
    </div>
  )
}
